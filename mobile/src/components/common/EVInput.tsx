import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, borderRadius, spacing } from '../../theme';

interface EVInputProps extends TextInputProps {
  label?: string;
  required?: boolean;
  error?: string;
  containerStyle?: ViewStyle;
  inputWrapperStyle?: ViewStyle;
  rightElement?: React.ReactNode;
  leftElement?: React.ReactNode;
  minHeight?: number;
  maxHeight?: number;
}

export const EVInput: React.FC<EVInputProps> = ({
  label,
  required,
  error,
  containerStyle,
  inputWrapperStyle,
  rightElement,
  leftElement,
  onFocus,
  onBlur,
  style,
  minHeight = 48,
  maxHeight = 160,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const calculateInitialHeight = (val: any, minH: number, maxH: number) => {
    if (!val || typeof val !== 'string') return minH;
    const lines = val.split('\n');
    let lineCount = lines.length;
    for (const line of lines) {
      if (line.length > 40) {
        lineCount += Math.floor(line.length / 40);
      }
    }
    if (lineCount <= 1) return minH;
    const computed = 24 + lineCount * 20;
    return Math.max(minH, Math.min(maxH, computed));
  };

  const [inputHeight, setInputHeight] = useState<number>(() => {
    if (rest.multiline) {
      return calculateInitialHeight(rest.value, minHeight, maxHeight);
    }
    return 48;
  });

  useEffect(() => {
    if (rest.multiline && rest.value !== undefined) {
      const estimated = calculateInitialHeight(rest.value, minHeight, maxHeight);
      setInputHeight((prev) => (prev < estimated ? estimated : prev));
    }
  }, [rest.value, rest.multiline, minHeight, maxHeight]);

  const handleContentSizeChange = (e: any) => {
    if (rest.multiline) {
      const contentH = e.nativeEvent?.contentSize?.height;
      if (contentH && typeof contentH === 'number') {
        const targetH = Math.max(minHeight, Math.min(maxHeight, Math.round(contentH + 18)));
        setInputHeight(targetH);
      }
    }
    if (rest.onContentSizeChange) {
      rest.onContentSizeChange(e);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
        </View>
      ) : null}

      <View
        style={[
          styles.inputWrapper,
          rest.multiline && [
            styles.inputWrapperMultiline,
            { height: inputHeight },
          ],
          inputWrapperStyle,
          isFocused && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
      >
        {leftElement ? (
          <View style={[styles.leftIcon, rest.multiline && styles.leftIconMultiline]}>
            {leftElement}
          </View>
        ) : null}

        <TextInput
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            rest.multiline && styles.inputMultiline,
            style,
          ]}
          textAlignVertical={rest.multiline ? 'top' : 'center'}
          onContentSizeChange={handleContentSizeChange}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          {...rest}
        />

        {rightElement ? (
          <View style={[styles.rightIcon, rest.multiline && styles.rightIconMultiline]}>
            {rightElement}
          </View>
        ) : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  requiredAsterisk: {
    color: colors.error,
    fontSize: 13,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputWrapperMultiline: {
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  inputFocused: {
    borderColor: colors.inputBorderFocus,
    backgroundColor: '#111C24',
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  inputMultiline: {
    height: '100%',
    lineHeight: 22,
    paddingTop: 0,
    paddingBottom: 0,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  leftIconMultiline: {
    marginTop: 2,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  rightIconMultiline: {
    marginTop: 2,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});
