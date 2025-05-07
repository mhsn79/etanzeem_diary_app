/**
 * Urdu localization constants
 */

// Urdu months
export const URDU_MONTHS = [
  'جنوری',   // January
  'فروری',   // February
  'مارچ',    // March
  'اپریل',   // April
  'مئی',     // May
  'جون',     // June
  'جولائی',  // July
  'اگست',    // August
  'ستمبر',   // September
  'اکتوبر',  // October
  'نومبر',   // November
  'دسمبر'    // December
];

// Helper function to get Urdu month name (1-based index, January = 1)
export const getUrduMonth = (monthNumber: number): string => {
  // Ensure month number is between 1-12
  if (monthNumber < 1 || monthNumber > 12) {
    console.warn(`Invalid month number: ${monthNumber}. Using default.`);
    return 'نامعلوم ماہ'; // Unknown month
  }
  
  // Convert 1-based month number to 0-based array index
  return URDU_MONTHS[monthNumber - 1];
};

// Urdu weekdays
export const URDU_WEEKDAYS = [
  'اتوار',    // Sunday
  'پیر',      // Monday
  'منگل',     // Tuesday
  'بدھ',      // Wednesday
  'جمعرات',   // Thursday
  'جمعہ',     // Friday
  'ہفتہ'      // Saturday
];

// Helper function to get Urdu weekday name (0-based index, Sunday = 0)
export const getUrduWeekday = (dayNumber: number): string => {
  // Ensure day number is between 0-6
  if (dayNumber < 0 || dayNumber > 6) {
    console.warn(`Invalid day number: ${dayNumber}. Using default.`);
    return 'نامعلوم دن'; // Unknown day
  }
  
  return URDU_WEEKDAYS[dayNumber];
};

/**
 * "متوقع تکمیل" جیسا اردو فارمیٹڈ جملہ واپس کرتا ہے۔
 *
 * Example:
 *   formatExpectedCompletion('2024-03-15');
 *   // → "متوقع تکمیل: 15 مارچ 2024"
 */
export const formatExpectedCompletion = (
  isoDate: string | Date,
  {
    extendedDays = 0,           // اگر آپ کو تاریخ میں دن بڑھانے ہوں
    label = 'متوقع تکمیل',      // جملے کی شروعات (ضرورت ہو تو بدل لیں)
    useUrduDigits = false        // true کریں تو اعداد ۰۱۲… کی صورت میں آئیں گے
  }: {
    extendedDays?: number;
    label?: string;
    useUrduDigits?: boolean;
  } = {}
): string => {
  // 1) تاریخ کو Date آبجیکٹ میں بدلیئے
  const date =
    typeof isoDate === 'string' ? new Date(isoDate) : new Date(isoDate);

  // 2) اضافی دن شامل کیجیے (اگر چاہیئے)
  if (extendedDays) {
    date.setDate(date.getDate() + extendedDays);
  }

  // 3) دن، مہینہ، سال حاصل کریں
  const day = date.getDate();
  const month = getUrduMonth(date.getMonth() + 1); // 1-based کیلئے +1
  const year = date.getFullYear();

  // 4) اردو ہندسوں کی ضرورت ہو تو بدلیں
  const formattedDay = useUrduDigits ? toUrduDigits(day) : day.toString();
  const formattedYear = useUrduDigits ? toUrduDigits(year) : year.toString();

  // 5) آخری سٹرنگ تیار
  return `${label}: ${formattedDay} ${month} ${formattedYear}`;
};

/* ------------------------------------------------------------------ */
/* مددگار فنکشن: انگریزی ہندسوں کو اردو ہندسوں میں بدلنا               */
/* ------------------------------------------------------------------ */

const EN_TO_URDU_DIGITS_MAP: Record<string, string> = {
  '0': '۰',
  '1': '۱',
  '2': '۲',
  '3': '۳',
  '4': '۴',
  '5': '۵',
  '6': '۶',
  '7': '۷',
  '8': '۸',
  '9': '۹'
};

export const toUrduDigits = (value: number | string): string =>
  value
    .toString()
    .split('')
    .map((d) => EN_TO_URDU_DIGITS_MAP[d] ?? d)
    .join('');
