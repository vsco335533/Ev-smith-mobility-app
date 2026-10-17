import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';
import { colors, borderRadius, spacing } from '../../theme';

interface ProgressStepperProps {
  currentStep: number;
  totalSteps?: number;
  stepTitles?: string[];
}

const DEFAULT_TITLES = ['Personal', 'Address', 'Identity', 'Emergency', 'Declaration'];

export const ProgressStepper: React.FC<ProgressStepperProps> = ({
  currentStep,
  totalSteps = 5,
  stepTitles = DEFAULT_TITLES,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.stepCounterText}>
          Step {currentStep} of {totalSteps}
        </Text>
        <Text style={styles.stepTitleText}>
          {stepTitles[currentStep - 1]}
        </Text>
      </View>

      <View style={styles.stepperRow}>
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <React.Fragment key={`step-${stepNumber}`}>
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                ]}
              >
                {isCompleted ? (
                  <Check size={12} color="#080C0E" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.circleText,
                      isActive && styles.circleTextActive,
                    ]}
                  >
                    {stepNumber}
                  </Text>
                )}
              </View>

              {index < totalSteps - 1 ? (
                <View
                  style={[
                    styles.connector,
                    stepNumber < currentStep && styles.connectorCompleted,
                  ]}
                />
              ) : null}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  stepCounterText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepTitleText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    borderColor: colors.primary,
    backgroundColor: '#003822',
  },
  circleCompleted: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  circleText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  circleTextActive: {
    color: colors.primary,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.surfaceBorder,
    marginHorizontal: 4,
  },
  connectorCompleted: {
    backgroundColor: colors.primary,
  },
});
