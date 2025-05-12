import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Text } from 'react-native';
import UrduText from '@/app/components/UrduText';
import FormInput from '@/app/components/FormInput';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS, SHADOWS } from '@/app/constants/theme';
import { ReportSection, ReportQuestion } from '@/app/features/qa/types';

interface AccordionSectionProps {
  section: ReportSection & { progress: number };
  questions: ReportQuestion[];
  onAnswerChange: (questionId: number, value: any) => void;
  answers: { [questionId: number]: any };
}

const AccordionSection = ({ section, questions, onAnswerChange, answers }: AccordionSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <View style={styles.sectionContainer}>
      <TouchableOpacity style={styles.sectionHeader} onPress={handleToggleSection}>
        <View style={styles.headerTextContainer}>
          <UrduText style={styles.sectionTitle}>
            {section.section_label.length > 50 ? `${section.section_label.slice(0, 50)}...` : section.section_label}
          </UrduText>
          {isOpen ? (
            <Ionicons name="chevron-up" size={24} color={COLORS.primary} />
          ) : (
            <Ionicons name="chevron-down" size={24} color={COLORS.primary} />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.questionsContainer}>
          {questions.map((question) => (
            <View key={question.id} style={styles.questionItem}>
            
              {renderQuestionInput(question, answers[question.id], (value) => onAnswerChange(question.id, value))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const renderQuestionInput = (
  question: ReportQuestion, 
  value: any, 
  onChange: (value: any) => void
) => {
  switch (question.input_type) {
    case 'number':
      return (
        <FormInput
          inputTitle={question.question_text}
          value={value || ''}
          onChange={(text) => {
            const numValue = text ? parseFloat(text) : 0;
            if (!isNaN(numValue)) {
              onChange(numValue);
            }
          }}
          placeholder=""
          keyboardType="numeric"
        />
      );
    case 'text':
    default:
      return (
        <FormInput
          inputTitle={question.question_text}
          value={value || ''}
          onChange={(text) => onChange(text)}
          placeholder=""
        />
      );
  }
};

interface SectionListProps {
  sections: Array<ReportSection & { progress: number }>;
  questions: ReportQuestion[];
  answers: { [questionId: number]: any };
  onAnswerChange: (questionId: number, value: any) => void;
}

const SectionList = ({ sections, questions, answers, onAnswerChange }: SectionListProps) => {
  return (
    <View style={styles.container}>
      {sections.map((section) => {
        const sectionQuestions = questions.filter((q) => q.section_id === section.id);
        return (
          <AccordionSection
            key={section.id}
            section={section}
            questions={sectionQuestions}
            answers={answers}
            onAnswerChange={onAnswerChange}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: SPACING.xl,
  },
  sectionContainer: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.medium,
  },
  sectionHeader: {
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: BORDER_RADIUS.sm,
  },
  headerTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSize.lg,
    textAlign: 'left',
    fontWeight: '600',
    color: COLORS.primary,
    flex: 1,
  },
  questionsContainer: {
  },
  questionItem: {
    padding: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  questionHeader: {
  },
  questionText: {
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.primary,
    textAlign: 'left',
  },
});

export default SectionList;