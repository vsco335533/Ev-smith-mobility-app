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
import { ArrowLeft, Calendar, ShieldCheck, Zap, Info } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVDatePicker } from '../../components/common/EVDatePicker';
import { apiClient } from '../../api/client';
import { Vehicle } from '../../types';

interface BookingRequestScreenProps {
  route: any;
  navigation: any;
}

export const BookingRequestScreen: React.FC<BookingRequestScreenProps> = ({
  route,
  navigation,
}) => {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Duration & Start Date selection
  const [durationDays, setDurationDays] = useState<number>(7);
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [quote, setQuote] = useState<{
    rental_amount: number;
    deposit_amount: number;
    total_amount: number;
    start_date: string;
    end_date: string;
  } | null>(null);

  useEffect(() => {
    const fetchVehicleAndQuote = async () => {
      try {
        const vRes = await apiClient.get(`/vehicles/${vehicleId}`);
        setVehicle(vRes.data);

        const qRes = await apiClient.post('/vehicles/calculate-quote', {
          vehicle_id: vehicleId,
          duration_days: durationDays,
          start_date: startDate ? new Date(startDate).toISOString() : undefined,
        });
        setQuote(qRes.data);
      } catch (err) {
        console.log('Error calculating quote:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicleAndQuote();
  }, [vehicleId, durationDays, startDate]);

  const handleSubmitRequest = async () => {
    if (!vehicle) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post('/bookings/request', {
        vehicle_id: vehicle.id,
        station_id: vehicle.station_id,
        duration_days: durationDays,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
      });

      const newBooking = res.data;
      Alert.alert(
        'Ride Request Submitted',
        'Your request has been submitted and is pending Super Admin review.',
        [
          {
            text: 'View Booking Status',
            onPress: () =>
              navigation.replace('BookingTimeline', { bookingId: newBooking.id }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Booking Error', err.message || 'Unable to submit booking request.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !vehicle) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const durationOptions = [
    { label: '1 Week (7 Days)', days: 7 },
    { label: '2 Weeks (14 Days)', days: 14 },
    { label: '1 Month (30 Days)', days: 30 },
  ];

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
          <Text style={styles.headerTitle}>Rental Request</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Selected Vehicle Overview */}
        <View style={styles.vehicleBanner}>
          <View style={styles.vehicleInfo}>
            <Text style={styles.vehicleName}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.vehicleReg}>{vehicle.registration_number}</Text>
            <Text style={styles.vehicleStation}>
              Pickup: {vehicle.station_name || 'HITEC City Hub'}
            </Text>
          </View>
          <View style={styles.vehicleRateBox}>
            <Text style={styles.vehicleRate}>₹{vehicle.daily_rate}</Text>
            <Text style={styles.vehicleRateUnit}>per day</Text>
          </View>
        </View>

        {/* Duration Selector */}
        <Text style={styles.sectionTitle}>Select Rental Duration</Text>
        <View style={styles.durationList}>
          {durationOptions.map((opt) => (
            <TouchableOpacity
              key={opt.days}
              style={[
                styles.durationCard,
                durationDays === opt.days && styles.durationCardActive,
              ]}
              onPress={() => setDurationDays(opt.days)}
              activeOpacity={0.8}
            >
              <View style={styles.durationRadio}>
                {durationDays === opt.days && <View style={styles.durationRadioInner} />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.durationLabel}>{opt.label}</Text>
                <Text style={styles.durationSub}>
                  ₹{vehicle.daily_rate * opt.days} total rent
                </Text>
              </View>
              <Calendar size={18} color={durationDays === opt.days ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Rental Start Date */}
        <Text style={styles.sectionTitle}>Rental Start Date</Text>
        <EVDatePicker
          label="Trip Start Date"
          value={startDate}
          onChange={setStartDate}
          placeholder="Select Rental Start Date"
          required
        />

        {/* Pricing Breakdown */}
        <Text style={styles.sectionTitle}>Price Summary & Billing</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Rental ({durationDays} days × ₹{vehicle.daily_rate})
            </Text>
            <Text style={styles.summaryValue}>₹{quote?.rental_amount || 0}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Refundable Security Deposit</Text>
            <Text style={styles.summaryValue}>₹{quote?.deposit_amount || 0}</Text>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRowTotal}>
            <Text style={styles.summaryTotalLabel}>Total Amount</Text>
            <Text style={styles.summaryTotalValue}>₹{quote?.total_amount || 0}</Text>
          </View>

          <View style={styles.depositNotice}>
            <Info size={14} color={colors.secondary} />
            <Text style={styles.depositNoticeText}>
              Security deposit is 100% refundable within 2 working days after vehicle return & final settlement.
            </Text>
          </View>
        </View>

        {/* Policy Highlights */}
        <View style={styles.policyCard}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={styles.policyText}>
            Includes full battery at handover, helmet, portable charger, and 24/7 roadside breakdown assistance.
          </Text>
        </View>

        <EVButton
          title="Submit Ride Request"
          onPress={handleSubmitRequest}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
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
  vehicleBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  vehicleReg: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  vehicleStation: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  vehicleRateBox: {
    alignItems: 'flex-end',
  },
  vehicleRate: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  vehicleRateUnit: {
    color: colors.textMuted,
    fontSize: 11,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  durationList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  durationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  durationCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
  },
  durationRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  durationLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  durationSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.sm,
  },
  summaryRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  summaryTotalLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  summaryTotalValue: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  depositNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    padding: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  depositNoticeText: {
    color: colors.secondary,
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  policyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  policyText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  submitBtn: {
    marginBottom: spacing.xl,
  },
});
