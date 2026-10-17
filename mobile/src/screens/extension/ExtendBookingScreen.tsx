import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Calendar, Clock, Plus, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { apiClient } from '../../api/client';
import { Booking } from '../../types';

interface ExtendBookingScreenProps {
  route: any;
  navigation: any;
}

export const ExtendBookingScreen: React.FC<ExtendBookingScreenProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Extension choices: 7, 30, or custom
  const [selectedDays, setSelectedDays] = useState<number>(7);
  const [customDays, setCustomDays] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiClient.get(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        console.log('Error loading booking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const effectiveDays = isCustom
    ? parseInt(customDays, 10) || 1
    : selectedDays;

  const additionalCost = booking ? roundPrice(booking.daily_rate * effectiveDays) : 0;

  function roundPrice(val: number) {
    return Math.round(val * 100) / 100;
  }

  const handleSelectPreset = (days: number) => {
    setIsCustom(false);
    setSelectedDays(days);
  };

  const handleSelectCustom = () => {
    setIsCustom(true);
  };

  const handleSubmitExtension = async () => {
    if (effectiveDays < 1) {
      Alert.alert('Invalid Duration', 'Please select at least 1 extension day.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/bookings/${bookingId}/extension`, {
        requested_days: effectiveDays,
        reason: reason.trim() || undefined,
      });

      Alert.alert(
        'Extension Requested',
        `Your request for ${effectiveDays} additional days (₹${additionalCost}) has been submitted for Super Admin review.`,
        [
          {
            text: 'Track Status',
            onPress: () =>
              navigation.replace('BookingTimeline', { bookingId }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Extension Error', err.message || 'Unable to request extension.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const currentEnd = new Date(booking.end_date);
  const projectedEnd = new Date(currentEnd.getTime() + effectiveDays * 24 * 60 * 60 * 1000);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Extend Rental</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Current Booking Snapshot */}
        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotTitle}>
            {booking.vehicle?.make} {booking.vehicle?.model}
          </Text>
          <Text style={styles.snapshotReg}>
            Reg: {booking.vehicle?.registration_number}
          </Text>
          <View style={styles.datesRow}>
            <View>
              <Text style={styles.dateLbl}>Current End Date</Text>
              <Text style={styles.dateVal}>
                {currentEnd.toLocaleDateString('en-GB')}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.dateLbl}>Daily Rate</Text>
              <Text style={[styles.dateVal, { color: colors.primary }]}>
                ₹{booking.daily_rate} / day
              </Text>
            </View>
          </View>
        </View>

        {/* Extension Presets */}
        <Text style={styles.sectionTitle}>Choose Extension Period</Text>
        <View style={styles.optionsGrid}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              !isCustom && selectedDays === 7 && styles.optionCardActive,
            ]}
            onPress={() => handleSelectPreset(7)}
            activeOpacity={0.8}
          >
            <View style={styles.radio}>
              {!isCustom && selectedDays === 7 && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>+ 1 Week</Text>
              <Text style={styles.optionSub}>7 Additional Days</Text>
            </View>
            <Text style={styles.optionCost}>₹{booking.daily_rate * 7}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              !isCustom && selectedDays === 30 && styles.optionCardActive,
            ]}
            onPress={() => handleSelectPreset(30)}
            activeOpacity={0.8}
          >
            <View style={styles.radio}>
              {!isCustom && selectedDays === 30 && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>+ 1 Month</Text>
              <Text style={styles.optionSub}>30 Additional Days</Text>
            </View>
            <Text style={styles.optionCost}>₹{booking.daily_rate * 30}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, isCustom && styles.optionCardActive]}
            onPress={handleSelectCustom}
            activeOpacity={0.8}
          >
            <View style={styles.radio}>
              {isCustom && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>Custom Days</Text>
              <Text style={styles.optionSub}>Specify exact rental days</Text>
            </View>
            <Plus size={18} color={isCustom ? colors.primary : colors.textMuted} />
          </TouchableOpacity>
        </View>

        {isCustom && (
          <EVInput
            label="Enter number of days"
            placeholder="e.g. 15"
            keyboardType="number-pad"
            value={customDays}
            onChangeText={setCustomDays}
            containerStyle={{ marginBottom: spacing.md }}
          />
        )}

        <EVInput
          label="Reason for Extension"
          placeholder="Brief explanation for admin approval"
          value={reason}
          onChangeText={setReason}
          multiline
        />

        {/* Calculation Overview */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Updated Rental Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>New Projected End Date:</Text>
            <Text style={styles.summaryValue}>
              {projectedEnd.toLocaleDateString('en-GB')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Additional Days:</Text>
            <Text style={styles.summaryValue}>+ {effectiveDays} Days</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRowTotal}>
            <Text style={styles.totalLabel}>Additional Rental Charge:</Text>
            <Text style={styles.totalValue}>₹{additionalCost}</Text>
          </View>
        </View>

        <EVButton
          title="Submit Extension Request"
          onPress={handleSubmitExtension}
          loading={submitting}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  snapshotCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  snapshotTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  snapshotReg: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  datesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    marginTop: spacing.md,
    paddingTop: spacing.sm,
  },
  dateLbl: {
    color: colors.textMuted,
    fontSize: 11,
  },
  dateVal: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  optionsGrid: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  optionSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  optionCost: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryBox: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  summaryTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.xs,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '800',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  submitBtn: {
    marginBottom: spacing.xxl,
  },
});
