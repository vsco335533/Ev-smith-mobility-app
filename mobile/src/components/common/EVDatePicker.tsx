import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { colors, borderRadius, spacing } from '../../theme';
import { EVButton } from './EVButton';

interface EVDatePickerProps {
  label?: string;
  value: string; // YYYY-MM-DD
  onChange: (dateStr: string) => void;
  required?: boolean;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  minYear?: number;
  maxYear?: number;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const EVDatePicker: React.FC<EVDatePickerProps> = ({
  label,
  value,
  onChange,
  required,
  placeholder = 'Select date',
  error,
  containerStyle,
  minYear = 1950,
  maxYear = new Date().getFullYear() + 2,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Parse initial selected date or default to current date
  const parseDate = (dStr: string) => {
    if (!dStr) return new Date();
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        return new Date(y, m, d);
      }
    }
    return new Date();
  };

  const initialDate = parseDate(value);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());
  const [tempSelectedDate, setTempSelectedDate] = useState<Date | null>(
    value ? initialDate : null
  );

  // Selector mode: 'CALENDAR' | 'YEAR' | 'MONTH'
  const [selectorMode, setSelectorMode] = useState<'CALENDAR' | 'YEAR' | 'MONTH'>('CALENDAR');

  const openPicker = () => {
    const d = parseDate(value);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth());
    setTempSelectedDate(value ? d : null);
    setSelectorMode('CALENDAR');
    setModalVisible(true);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    setTempSelectedDate(selected);
  };

  const handleConfirm = () => {
    if (tempSelectedDate) {
      const y = tempSelectedDate.getFullYear();
      const m = String(tempSelectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(tempSelectedDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
    setModalVisible(false);
  };

  // Format display in input box
  const formatDisplay = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = parts[0];
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (m >= 0 && m < 12) {
        return `${d} ${MONTH_NAMES[m].slice(0, 3)} ${y}`;
      }
    }
    return dStr;
  };

  // Generate days in month
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  // Year list for quick jumping (DOB)
  const yearsList: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearsList.push(y);
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required ? <Text style={styles.requiredAsterisk}> *</Text> : null}
        </View>
      ) : null}

      <TouchableOpacity
        style={[
          styles.inputWrapper,
          modalVisible && styles.inputFocused,
          Boolean(error) && styles.inputError,
        ]}
        onPress={openPicker}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.inputText,
            !value && styles.placeholderText,
          ]}
        >
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <CalendarIcon size={18} color={colors.primary} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* DATE PICKER MODAL */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.calendarHeader}>
              <View style={styles.navRow}>
                <TouchableOpacity
                  style={styles.headerTitleBtn}
                  onPress={() =>
                    setSelectorMode(selectorMode === 'MONTH' ? 'CALENDAR' : 'MONTH')
                  }
                >
                  <Text style={styles.monthTitle}>{MONTH_NAMES[viewMonth]}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.headerTitleBtn, styles.yearBadge]}
                  onPress={() =>
                    setSelectorMode(selectorMode === 'YEAR' ? 'CALENDAR' : 'YEAR')
                  }
                >
                  <Text style={styles.yearTitle}>{viewYear} ▾</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.arrowRow}>
                <TouchableOpacity
                  style={styles.arrowBtn}
                  onPress={handlePrevMonth}
                  activeOpacity={0.7}
                >
                  <ChevronLeft size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.arrowBtn}
                  onPress={handleNextMonth}
                  activeOpacity={0.7}
                >
                  <ChevronRight size={20} color={colors.textPrimary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.arrowBtn, { marginLeft: 8 }]}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <X size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            {/* BODY: YEAR SELECTOR, MONTH SELECTOR, OR CALENDAR GRID */}
            {selectorMode === 'YEAR' ? (
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorSubtitle}>Select Year (Quick Jump):</Text>
                <ScrollView
                  style={styles.yearScroll}
                  contentContainerStyle={styles.yearGrid}
                  showsVerticalScrollIndicator
                >
                  {yearsList.map((y) => (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.yearItem,
                        y === viewYear && styles.yearItemActive,
                      ]}
                      onPress={() => {
                        setViewYear(y);
                        setSelectorMode('CALENDAR');
                      }}
                    >
                      <Text
                        style={[
                          styles.yearItemText,
                          y === viewYear && styles.yearItemTextActive,
                        ]}
                      >
                        {y}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : selectorMode === 'MONTH' ? (
              <View style={styles.selectorContainer}>
                <Text style={styles.selectorSubtitle}>Select Month:</Text>
                <View style={styles.monthGrid}>
                  {MONTH_NAMES.map((m, idx) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        styles.monthItem,
                        idx === viewMonth && styles.monthItemActive,
                      ]}
                      onPress={() => {
                        setViewMonth(idx);
                        setSelectorMode('CALENDAR');
                      }}
                    >
                      <Text
                        style={[
                          styles.monthItemText,
                          idx === viewMonth && styles.monthItemTextActive,
                        ]}
                      >
                        {m.slice(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : (
              <View>
                {/* Days of Week */}
                <View style={styles.dayOfWeekRow}>
                  {DAYS_OF_WEEK.map((d, i) => (
                    <Text
                      key={i}
                      style={[
                        styles.dayOfWeekText,
                        (i === 0 || i === 6) && { color: colors.warning },
                      ]}
                    >
                      {d}
                    </Text>
                  ))}
                </View>

                {/* Day Grid */}
                <View style={styles.daysGrid}>
                  {/* Empty slots for month start offset */}
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}

                  {/* Month days */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const isSelected =
                      tempSelectedDate &&
                      tempSelectedDate.getFullYear() === viewYear &&
                      tempSelectedDate.getMonth() === viewMonth &&
                      tempSelectedDate.getDate() === dayNum;

                    const isToday =
                      new Date().getFullYear() === viewYear &&
                      new Date().getMonth() === viewMonth &&
                      new Date().getDate() === dayNum;

                    return (
                      <TouchableOpacity
                        key={`day-${dayNum}`}
                        style={[
                          styles.dayCell,
                          isSelected && styles.dayCellSelected,
                          isToday && !isSelected && styles.dayCellToday,
                        ]}
                        onPress={() => handleSelectDay(dayNum)}
                        activeOpacity={0.6}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.dayTextSelected,
                            isToday && !isSelected && styles.dayTextToday,
                          ]}
                        >
                          {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Footer Actions */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.todayBtn}
                onPress={() => {
                  const today = new Date();
                  setViewYear(today.getFullYear());
                  setViewMonth(today.getMonth());
                  setTempSelectedDate(today);
                  setSelectorMode('CALENDAR');
                }}
              >
                <Text style={styles.todayBtnText}>Today</Text>
              </TouchableOpacity>

              <EVButton
                title="Confirm Date"
                onPress={handleConfirm}
                variant="primary"
                size="sm"
                style={{ flex: 1.4 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: '#111C24',
  },
  inputError: {
    borderColor: colors.error,
  },
  inputText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  placeholderText: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  yearBadge: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
  },
  monthTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  yearTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  arrowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayOfWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  dayOfWeekText: {
    width: 38,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
  },
  dayCellToday: {
    borderWidth: 1,
    borderColor: colors.primary,
  },
  dayText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  dayTextSelected: {
    color: '#080C0E',
    fontWeight: '800',
  },
  dayTextToday: {
    color: colors.primary,
    fontWeight: '700',
  },
  selectorContainer: {
    height: 240,
  },
  selectorSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  yearScroll: {
    flex: 1,
  },
  yearGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 16,
  },
  yearItem: {
    width: '30%',
    paddingVertical: 10,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  yearItemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
  },
  yearItemText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  yearItemTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthItem: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  monthItemActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
  },
  monthItemText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  monthItemTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },
  modalBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelBtnText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  todayBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
  },
  todayBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
