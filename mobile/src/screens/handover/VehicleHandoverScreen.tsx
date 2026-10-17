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
import {
  ArrowLeft,
  CheckCircle2,
  Key,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { apiClient } from '../../api/client';
import { Booking } from '../../types';

interface VehicleHandoverScreenProps {
  route: any;
  navigation: any;
}

export const VehicleHandoverScreen: React.FC<VehicleHandoverScreenProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inspection states - No dummy data, manual entry required
  const [tyresCondition, setTyresCondition] = useState<'GOOD' | 'DAMAGED'>('GOOD');
  const [brakesCondition, setBrakesCondition] = useState<'GOOD' | 'DAMAGED'>('GOOD');
  const [electricalsCondition, setElectricalsCondition] = useState<'WORKING' | 'NOT_WORKING'>('WORKING');
  const [batteryPct, setBatteryPct] = useState<string>('');

  // Accessories - Unchecked by default, manual confirmation required
  const [hasHelmet, setHasHelmet] = useState(false);
  const [hasCharger, setHasCharger] = useState(false);
  const [hasToolbox, setHasToolbox] = useState(false);

  const [inspectorNotes, setInspectorNotes] = useState('');

  // Success state
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await apiClient.get(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        console.log('Error loading booking for handover:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const handleSubmitHandover = async () => {
    if (!batteryPct.trim()) {
      Alert.alert('Battery Reading Required', 'Please manually input the scooter battery percentage.');
      return;
    }
    const bNum = parseInt(batteryPct, 10);
    if (isNaN(bNum) || bNum < 0 || bNum > 100) {
      Alert.alert('Invalid Battery %', 'Please enter a valid battery percentage between 0 and 100.');
      return;
    }
    if (!inspectorNotes.trim()) {
      Alert.alert('Remarks Required', 'Please manually enter station handover remarks.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/bookings/${bookingId}/handover`, {
        tyres_condition: tyresCondition,
        brakes_condition: brakesCondition,
        electricals_condition: electricalsCondition,
        battery_percentage_at_handover: bNum,
        has_helmet: hasHelmet,
        has_charger: hasCharger,
        has_toolbox: hasToolbox,
        inspector_notes: inspectorNotes.trim(),
      });

      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Handover Error', err.message || 'Unable to confirm handover.');
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

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successWrapper}>
          <View style={styles.celebrationCircle}>
            <Sparkles size={40} color="#080C0E" />
          </View>
          <Text style={styles.successHeading}>Booking Confirmed!</Text>
          <Text style={styles.successSub}>Your EV ride is now active.</Text>

          <View style={styles.successDetailsCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Booking ID:</Text>
              <Text style={styles.summaryValue}>#{booking.booking_number}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Vehicle:</Text>
              <Text style={styles.summaryValue}>
                {booking.vehicle?.make} {booking.vehicle?.model}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Registration:</Text>
              <Text style={styles.summaryValue}>
                {booking.vehicle?.registration_number}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Station:</Text>
              <Text style={styles.summaryValue}>
                {booking.station?.name || 'HITEC City Hub'}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Duration:</Text>
              <Text style={styles.summaryValue}>{booking.duration_days} Days</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Status:</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]}>
                ACTIVE
              </Text>
            </View>
          </View>

          <EVButton
            title="Open Active Ride Dashboard"
            onPress={() =>
              navigation.replace('ActiveBooking', { bookingId: booking.id })
            }
            variant="primary"
            size="lg"
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Station Vehicle Handover</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Handover Notice */}
        <View style={styles.stationNotice}>
          <Key size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.stationNoticeTitle}>At the EV Station</Text>
            <Text style={styles.stationNoticeText}>
              Verify the scooter specifications and complete the checklist alongside the station supervisor.
            </Text>
          </View>
        </View>

        {/* Vehicle & Rental Specifications */}
        <Text style={styles.sectionTitle}>Vehicle Specifications</Text>
        <View style={styles.specCard}>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Make & Model</Text>
            <Text style={styles.specValue}>
              {booking.vehicle?.make} {booking.vehicle?.model}
            </Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Registration No.</Text>
            <Text style={styles.specValue}>
              {booking.vehicle?.registration_number}
            </Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Chassis Number</Text>
            <Text style={styles.specValue}>
              {booking.vehicle?.chassis_number}
            </Text>
          </View>
          <View style={styles.specRow}>
            <Text style={styles.specLabel}>Security Deposit</Text>
            <Text style={[styles.specValue, { color: colors.primary }]}>
              ₹{booking.deposit_amount}
            </Text>
          </View>
        </View>

        {/* PHYSICAL CONDITION CHECKLIST */}
        <Text style={styles.sectionTitle}>Vehicle Condition Checklist</Text>

        {/* Tyres */}
        <View style={styles.checkCard}>
          <Text style={styles.checkTitle}>Front & Rear Tyres</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                tyresCondition === 'GOOD' && styles.radioBtnActive,
              ]}
              onPress={() => setTyresCondition('GOOD')}
            >
              <Text
                style={[
                  styles.radioText,
                  tyresCondition === 'GOOD' && styles.radioTextActive,
                ]}
              >
                Good
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                tyresCondition === 'DAMAGED' && styles.radioBtnDanger,
              ]}
              onPress={() => setTyresCondition('DAMAGED')}
            >
              <Text
                style={[
                  styles.radioText,
                  tyresCondition === 'DAMAGED' && styles.radioTextDanger,
                ]}
              >
                Damaged
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Brakes */}
        <View style={styles.checkCard}>
          <Text style={styles.checkTitle}>Braking System</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                brakesCondition === 'GOOD' && styles.radioBtnActive,
              ]}
              onPress={() => setBrakesCondition('GOOD')}
            >
              <Text
                style={[
                  styles.radioText,
                  brakesCondition === 'GOOD' && styles.radioTextActive,
                ]}
              >
                Good
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                brakesCondition === 'DAMAGED' && styles.radioBtnDanger,
              ]}
              onPress={() => setBrakesCondition('DAMAGED')}
            >
              <Text
                style={[
                  styles.radioText,
                  brakesCondition === 'DAMAGED' && styles.radioTextDanger,
                ]}
              >
                Damaged
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Electricals */}
        <View style={styles.checkCard}>
          <Text style={styles.checkTitle}>Electricals & Display</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                electricalsCondition === 'WORKING' && styles.radioBtnActive,
              ]}
              onPress={() => setElectricalsCondition('WORKING')}
            >
              <Text
                style={[
                  styles.radioText,
                  electricalsCondition === 'WORKING' && styles.radioTextActive,
                ]}
              >
                Working
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.radioBtn,
                electricalsCondition === 'NOT_WORKING' && styles.radioBtnDanger,
              ]}
              onPress={() => setElectricalsCondition('NOT_WORKING')}
            >
              <Text
                style={[
                  styles.radioText,
                  electricalsCondition === 'NOT_WORKING' && styles.radioTextDanger,
                ]}
              >
                Not Working
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Battery Level */}
        <View style={styles.checkCard}>
          <Text style={styles.checkTitle}>Battery Charge at Delivery (%)</Text>
          <EVInput
            placeholder="100"
            keyboardType="number-pad"
            value={batteryPct}
            onChangeText={setBatteryPct}
            maxLength={3}
            containerStyle={{ marginBottom: 0, marginTop: spacing.xs }}
          />
        </View>

        {/* Accessories Provided */}
        <Text style={styles.sectionTitle}>Accessories Provided</Text>
        <View style={styles.accessoriesCard}>
          <TouchableOpacity
            style={styles.accessoryRow}
            onPress={() => setHasHelmet(!hasHelmet)}
            activeOpacity={0.8}
          >
            <View style={[styles.accBox, hasHelmet && styles.accBoxChecked]}>
              {hasHelmet && <Check size={14} color="#080C0E" strokeWidth={3} />}
            </View>
            <Text style={styles.accText}>EVSMITH Helmet</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accessoryRow}
            onPress={() => setHasCharger(!hasCharger)}
            activeOpacity={0.8}
          >
            <View style={[styles.accBox, hasCharger && styles.accBoxChecked]}>
              {hasCharger && <Check size={14} color="#080C0E" strokeWidth={3} />}
            </View>
            <Text style={styles.accText}>Portable Smart Charger</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accessoryRow}
            onPress={() => setHasToolbox(!hasToolbox)}
            activeOpacity={0.8}
          >
            <View style={[styles.accBox, hasToolbox && styles.accBoxChecked]}>
              {hasToolbox && <Check size={14} color="#080C0E" strokeWidth={3} />}
            </View>
            <Text style={styles.accText}>Emergency Tool Box & First Aid Kit</Text>
          </TouchableOpacity>
        </View>

        {/* Inspector Remarks */}
        <EVInput
          label="Station Handover Remarks"
          value={inspectorNotes}
          onChangeText={setInspectorNotes}
          multiline
        />

        <EVButton
          title="Confirm Handover & Start Ride"
          onPress={handleSubmitHandover}
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
    fontSize: 18,
    fontWeight: '700',
  },
  stationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.3)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  stationNoticeTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  stationNoticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  specCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  specValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  checkCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  checkTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  radioBtn: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  radioBtnActive: {
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    borderColor: colors.primary,
  },
  radioBtnDanger: {
    backgroundColor: 'rgba(255, 77, 77, 0.15)',
    borderColor: colors.error,
  },
  radioText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  radioTextActive: {
    color: colors.primary,
  },
  radioTextDanger: {
    color: colors.error,
  },
  accessoriesCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  accessoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  accBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
  },
  accBoxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  accText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    marginTop: spacing.md,
    marginBottom: spacing.xxl,
  },
  successWrapper: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 18,
    elevation: 12,
  },
  successHeading: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  successSub: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  successDetailsCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
