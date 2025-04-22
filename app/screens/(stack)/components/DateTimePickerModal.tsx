import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  Dimensions,
  Animated,
  Easing,
  TextInput,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '@/app/constants/theme';
import UrduText from '@/app/components/UrduText';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line, Circle as SvgCircle, Text as SvgText, G } from 'react-native-svg';

/** 
 * Reindex getDay() so that Monday=0, Tuesday=1, … Sunday=6,
 * then fill a 6×7 (42) grid of Dates.
 */
function generateCalendarDays(year: number, month: number) {
  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = endOfMonth.getDate();

  // JS getDay(): Sunday=0, Monday=1, ...
  // Shift so Monday=0 => let day = (getDay() + 6) % 7
  let startDay = startOfMonth.getDay();
  startDay = (startDay + 6) % 7; // Now Monday=0, Tuesday=1, Sunday=6

  const totalCells = 42; 
  const dayArray: Date[] = [];

  // Fill trailing days from the previous month
  for (let i = 0; i < startDay; i++) {
    dayArray.push(new Date(year, month, 1 - (startDay - i)));
  }

  // Fill current month
  for (let i = 1; i <= daysInMonth; i++) {
    dayArray.push(new Date(year, month, i));
  }

  // Fill from the next month
  const extraNeeded = totalCells - dayArray.length;
  const lastDay = dayArray[dayArray.length - 1];
  for (let i = 1; i <= extraNeeded; i++) {
    dayArray.push(new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate() + i));
  }

  return dayArray; 
}

function formatDateHeader(date: Date) {
  return date.toDateString();
}

/** Outer ring: 12..1 going counterclockwise, top=12 => -90°, etc. */
function buildOuterHours(radius: number, center: number) {
  const hours = [12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const data = [];
  for (let i = 0; i < 12; i++) {
    const hourVal = hours[i];
    const angleDeg = -90 - i * 30;
    const rad = (Math.PI / 180) * angleDeg;
    const x = center + radius * Math.cos(rad);
    const y = center + radius * Math.sin(rad);
    data.push({ hour: hourVal, x, y });
  }
  return data;
}

/** Inner ring: top=00 => -90°, then 13..23 clockwise. */
function buildInnerHours(radius: number, center: number) {
  const data = [];
  for (let i = 0; i < 12; i++) {
    const angleDeg = i * 30 - 90;
    const rad = (Math.PI / 180) * angleDeg;
    const x = center + radius * Math.cos(rad);
    const y = center + radius * Math.sin(rad);

    let hourVal = 13 + (i - 1);
    if (i === 0) hourVal = 0; // "00"
    else if (i >= 1) hourVal = 12 + i; // 13..23

    data.push({ hour: hourVal, x, y });
  }
  return data;
}

interface DateTimePickerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  selectedDate: Date | null;
}

const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  isVisible,
  onClose,
  onSelect,
  selectedDate,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Calendar state
  const [date, setDate] = useState<Date>(selectedDate || new Date());
  const [currentMonth, setCurrentMonth] = useState(date.getMonth());
  const [currentYear, setCurrentYear] = useState(date.getFullYear());

  // ======= Hour State ======= //
  const [hour, setHour] = useState(date.getHours());
  const [manualTime, setManualTime] = useState('');
  const [timeError, setTimeError] = useState('');

  // For “pop” animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const animateSelection = useCallback(() => {
    scaleAnim.setValue(0.8);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: false,
    }).start();
  }, [scaleAnim]);

  // If user changes `selectedDate` while open
  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
      setHour(selectedDate.getHours());
      setCurrentMonth(selectedDate.getMonth());
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [selectedDate, isVisible]);

  // Monday-based day array
    // Set default time when component mounts or selectedDate changes
    useEffect(() => {
        const defaultTime = `${String(hour).padStart(2, '0')}:00`;
        setManualTime(defaultTime);
      }, [hour, selectedDate]);
    
  const daysArray = generateCalendarDays(currentYear, currentMonth);

  // We chunk the 42 days into 6 rows × 7 columns
  const weeks = [];
  for (let row = 0; row < 6; row++) {
    const sliceStart = row * 7;
    const sliceEnd = sliceStart + 7;
    weeks.push(daysArray.slice(sliceStart, sliceEnd));
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear((yr) => yr - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear((yr) => yr + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleDayPress = (d: Date) => {
    setDate(d);
    setCurrentMonth(d.getMonth());
    setCurrentYear(d.getFullYear());
  };

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear();

  // For the time ring
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const CLOCK_SIZE = Math.min(SCREEN_WIDTH * 0.8, 300);
  const CENTER = CLOCK_SIZE / 2;
  const OUTER_RADIUS = CLOCK_SIZE / 2 - 20;
  const INNER_RADIUS = CLOCK_SIZE / 2 - 70;

  const outerHours = buildOuterHours(OUTER_RADIUS, CENTER);
  const innerHours = buildInnerHours(INNER_RADIUS, CENTER);

  const inOuterRing = hour >= 1 && hour <= 12;
  const inInnerRing = hour === 0 || (hour >= 13 && hour <= 23);

  let selectedPoint;
  if (inOuterRing) {
    selectedPoint = outerHours.find((pt) => pt.hour === hour);
  } else if (inInnerRing) {
    selectedPoint = innerHours.find((pt) => pt.hour === hour);
  }

  const handleSelectHour = (val: number) => {
    setHour(val);
    animateSelection();
  };
  const handleManualTimeChange = (text: string) => {
    // Only allow numbers and ensure length is 2
    const numbersOnly = text.replace(/[^0-9]/g, '');
    if (numbersOnly.length <= 2) {
      setManualTime(numbersOnly);
      setTimeError('');
      
      // Validate hour when 2 digits are entered
      if (numbersOnly.length === 2) {
        const hourValue = parseInt(numbersOnly, 10);
        if (hourValue >= 0 && hourValue <= 23) {
          setHour(hourValue);
          animateSelection();
          setManualTime(`${numbersOnly}:00`);
        } else {
          setTimeError('Please enter a valid hour (00-23)');
        }
      }
    }
  };

  const handleConfirm = () => {
    const finalDate = new Date(
      currentYear,
      currentMonth,
      date.getDate(),
      hour,
      0,
      0,
      0
    );
    onSelect(finalDate);
    onClose();
  };

  // For the highlight circle
  let highlightTransform = '';
  if (selectedPoint) {
    const { x, y } = selectedPoint;
    let currentScale = 1;
    scaleAnim.addListener(({ value }) => {
      currentScale = value;
    });
    highlightTransform = `translate(${x}, ${y}) scale(${currentScale}) translate(${-x}, ${-y})`;
  }

  // Monday-based days of week row
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const TABS = [
    { label: 'CALENDER', value: 0 },
    { label: 'TIME', value: 1 },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          {/* Close Icon */}
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <Ionicons name="close" size={24} color={COLORS.black} />
          </TouchableOpacity>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {TABS.map((t, i) => (
              <TouchableOpacity
                key={t.value}
                style={[styles.tabItem, activeTab === i && styles.tabItemActive]}
                onPress={() => setActiveTab(i)}
              >
                <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* CALENDAR TAB */}
          {activeTab === 0 && (
            <View style={styles.calendarContainer}>
              <Text style={styles.dateHeader}>
                {formatDateHeader(new Date(currentYear, currentMonth, date.getDate()))}
              </Text>

              {/* Month nav */}
              <View style={styles.monthNav}>
                <TouchableOpacity onPress={handleNextMonth}>
                  <Ionicons name="chevron-forward" size={24} color={COLORS.black} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                  {new Date(currentYear, currentMonth, 1).toLocaleString('default', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </Text>
                <TouchableOpacity onPress={handlePrevMonth}>
                  <Ionicons name="chevron-back" size={24} color={COLORS.black} />
                </TouchableOpacity>
              </View>

              {/* Monday-based weekday row */}
              <View style={styles.daysOfWeekRow}>
                {daysOfWeek.map((day) => (
                  <Text key={day} style={styles.dayOfWeek}>
                    {day}
                  </Text>
                ))}
              </View>

              {/* 6 rows × 7 columns of dates */}
              {weeks.map((week, rowIndex) => (
                <View style={styles.weekRow} key={`week-${rowIndex}`}>
                  {week.map((d, colIndex) => {
                    const inMonth = d.getMonth() === currentMonth;
                    const selected = isSameDay(d, date);
                    return (
                      <TouchableOpacity
                        key={colIndex}
                        style={[
                          styles.dayContainer,
                          !inMonth && { opacity: 0.4 },
                          selected && { backgroundColor: COLORS.primary },
                        ]}
                        onPress={() => handleDayPress(d)}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            selected && { color: COLORS.white },
                          ]}
                        >
                          {d.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}

          {/* TIME TAB */}
          {activeTab === 1 && (
            <View style={styles.timeContainer}>
                   {/* Manual Time Input */}
                   <View style={styles.manualTimeContainer}>
                <View style={styles.timeInputWrapper}>
                <Text style={styles.staticMinutes}>00</Text>
                <Text style={styles.timeSeparator}>:</Text>
                  <TextInput
                    style={[styles.timeInput, timeError && styles.timeInputError]}
                    value={manualTime.split(':')[0]}
                    onChangeText={handleManualTimeChange}
                    maxLength={2}
                    keyboardType="numeric"
                    placeholder="HH"
                  />
                 
                </View>
                {timeError ? (
                  <Text style={styles.errorText}>{timeError}</Text>
                ) : null}
              </View>

              <View style={styles.radialClockWrapper}>
                <Svg width={CLOCK_SIZE} height={CLOCK_SIZE}>
                  {/* BG circle */}
                  <SvgCircle
                    cx={CLOCK_SIZE / 2}
                    cy={CLOCK_SIZE / 2}
                    r={CLOCK_SIZE / 2}
                    fill={COLORS.lightGray}
                  />

                  {/* Outer ring */}
                  {outerHours.map(({ hour: hVal, x, y }) => {
                    const isSelected = hVal === hour;
                    return (
                      <React.Fragment key={`outer-${hVal}`}>
                        <SvgText
                          x={x}
                          y={y + 5}
                          fill={isSelected ? COLORS.white : COLORS.black}
                          fontSize={TYPOGRAPHY.fontSize.md}
                          fontWeight="bold"
                          textAnchor="middle"
                          onPress={() => handleSelectHour(hVal)}
                        >
                          {hVal}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* Inner ring */}
                  {innerHours.map(({ hour: hVal, x, y }) => {
                    const isSelected = hVal === hour;
                    const label = hVal === 0 ? '00' : String(hVal);
                    return (
                      <React.Fragment key={`inner-${hVal}`}>
                        <SvgText
                          x={x}
                          y={y + 5}
                          fill={isSelected ? COLORS.white : COLORS.black}
                          fontSize={TYPOGRAPHY.fontSize.md}
                          fontWeight="bold"
                          textAnchor="middle"
                          onPress={() => handleSelectHour(hVal)}
                        >
                          {label}
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* Animated highlight */}
                  {selectedPoint && (
                    <G transform={highlightTransform}>
                      <Line
                        x1={CLOCK_SIZE / 2}
                        y1={CLOCK_SIZE / 2}
                        x2={selectedPoint.x}
                        y2={selectedPoint.y}
                        stroke={COLORS.primary}
                        strokeWidth={3}
                      />
                      <SvgCircle
                        cx={selectedPoint.x}
                        cy={selectedPoint.y}
                        r={10}
                        fill={COLORS.primary}
                      />
                    </G>
                  )}
                </Svg>
              </View>
            </View>
          )}

          {/* Confirm btn */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <UrduText style={styles.confirmBtnText}>منتخب کریں</UrduText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ========== Styles ========== //
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    maxHeight: '90%',
    position: 'relative',
  },
  closeIcon: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    zIndex: 999,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    marginTop: SPACING.xl,
  },
  tabItem: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.black,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '500',
  },
  tabTextActive: {
    color: COLORS.white,
  },

  calendarContainer: {
    marginBottom: SPACING.md,
  },
  dateHeader: {
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  monthTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    fontWeight: '600',
    color: COLORS.primary,
  },
  daysOfWeekRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: SPACING.xs,
  },
  dayOfWeek: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  weekRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-around',
    marginBottom: SPACING.xs,
  },
  dayContainer: {
    width: '12%',
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    marginVertical: 5,
    paddingVertical: 6,
  },
  dayText: {
    fontSize: TYPOGRAPHY.fontSize.md,
  },
  timeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  selectedTime: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  radialClockWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
  confirmBtnText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.fontSize.md,
    fontWeight: '600',
  },
  manualTimeContainer: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  timeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    textAlign: 'center',
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  timeSeparator: {  
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  staticMinutes: {
    fontSize: TYPOGRAPHY.fontSize.xl,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: SPACING.md,
  },
  timeInputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginTop: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});

export default DateTimePickerModal;
