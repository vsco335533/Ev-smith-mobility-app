import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BatteryCharging,
  Zap,
  Clock,
  Calendar,
  RotateCcw,
  ShieldAlert,
  ArrowRight,
  Bell,
  RefreshCw,
  LogOut,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { apiClient } from '../../api/client';
import { Booking } from '../../types';

interface ActiveBookingScreenProps {
  route: any;
  navigation: any;
}

export const ActiveBookingScreen: React.FC<ActiveBookingScreenProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  // Expiry notification modal simulation
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  // Vehicle change / replacement modal - No dummy data
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changeReason, setChangeReason] = useState('');
  const [paymentMode, setPaymentMode] = useState<'ONLINE' | 'CASH'>('ONLINE');
  const [damageRemarks, setDamageRemarks] = useState('');
  const [submittingChange, setSubmittingChange] = useState(false);

  // Returning state
  const [returning, setReturning] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await apiClient.get(`/bookings/${bookingId}`);
      setBooking(res.data);
    } catch (err) {
      console.log('Error fetching active booking:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Calculate remaining days
  const calculateRemainingDays = (endDateStr: string) => {
    const end = new Date(endDateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const handleReturnVehicle = async () => {
    Alert.alert(
      'Return Vehicle & Settle',
      'Are you sure you want to return the vehicle at the station and generate the final settlement statement?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Return',
          onPress: async () => {
            setReturning(true);
            try {
              await apiClient.post(`/bookings/${bookingId}/return`);
              navigation.replace('FinalSettlement', { bookingId });
            } catch (err: any) {
              Alert.alert('Return Error', err.message || 'Unable to initiate vehicle return.');
            } finally {
              setReturning(false);
            }
          },
        },
      ]
    );
  };

  const handleSubmitVehicleChange = async () => {
    if (!changeReason.trim()) {
      Alert.alert('Reason Required', 'Please specify a valid reason for vehicle replacement.');
      return;
    }
    setSubmittingChange(true);
    try {
      await apiClient.post(`/bookings/${bookingId}/vehicle-change`, {
        reason: changeReason.trim(),
        preferred_payment_mode: paymentMode,
        pre_existing_damage_remarks: damageRemarks.trim(),
      });
      setShowChangeModal(false);
      Alert.alert(
        'Replacement Requested',
        'Your vehicle change request has been submitted for Super Admin review.',
        [{ text: 'OK', onPress: fetchBooking }]
      );
    } catch (err: any) {
      Alert.alert('Request Failed', err.message);
    } finally {
      setSubmittingChange(false);
    }
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const remainingDays = calculateRemainingDays(booking.end_date);
  const formattedEndDate = new Date(booking.end_date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.navigate('MainTabs')}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.activePill}>
            <View style={styles.pulsingDot} />
            <Text style={styles.activePillText}>ACTIVE RIDE</Text>
          </View>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setShowExpiryModal(true)}
            activeOpacity={0.7}
          >
            <Bell size={18} color={colors.warning} />
          </TouchableOpacity>
        </View>

        {/* Hero Vehicle Card */}
        <View style={styles.heroCard}>
          <Image
            source={{
              uri:
                booking.vehicle?.image_url ||
                'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />

          <View style={styles.heroContent}>
            <View style={styles.heroTitleRow}>
              <View>
                <Text style={styles.vehicleTitle}>
                  {booking.vehicle?.make} {booking.vehicle?.model}
                </Text>
                <Text style={styles.vehicleReg}>
                  {booking.vehicle?.registration_number}
                </Text>
              </View>
              <View style={styles.hubBadge}>
                <Text style={styles.hubText}>
                  {booking.station?.name || 'HITEC City Hub'}
                </Text>
              </View>
            </View>

            {/* Live Telemetry Meter */}
            <View style={styles.telemetryGrid}>
              <View style={styles.telemetryItem}>
                <BatteryCharging size={20} color={colors.primary} />
                <Text style={styles.telemetryVal}>
                  {booking.vehicle?.battery_percentage || 94}%
                </Text>
                <Text style={styles.telemetryLbl}>Battery Charge</Text>
              </View>

              <View style={styles.telemetryDivider} />

              <View style={styles.telemetryItem}>
                <Zap size={20} color={colors.secondary} />
                <Text style={styles.telemetryVal}>
                  {booking.vehicle?.range_km || 110} km
                </Text>
                <Text style={styles.telemetryLbl}>Live Range</Text>
              </View>

              <View style={styles.telemetryDivider} />

              <View style={styles.telemetryItem}>
                <Clock size={20} color="#FFB020" />
                <Text style={styles.telemetryVal}>{remainingDays} Days</Text>
                <Text style={styles.telemetryLbl}>Remaining</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Expiry Countdown Card */}
        <View style={styles.countdownCard}>
          <View style={styles.countdownHeader}>
            <Calendar size={18} color={colors.primary} />
            <Text style={styles.countdownTitle}>Rental Period & Expiry</Text>
          </View>
          <View style={styles.countdownHighlight}>
            <Text style={styles.countdownDays}>{remainingDays} Days Remaining</Text>
            <Text style={styles.countdownDate}>Expires on {formattedEndDate}</Text>
          </View>
          <Text style={styles.countdownSub}>
            Extend your booking before expiry to avoid standard late return charges of ₹100/day.
          </Text>
        </View>

        {/* Financial Overview */}
        <View style={styles.billingCard}>
          <Text style={styles.billingTitle}>Rental Billing Overview</Text>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Rental Charges Paid:</Text>
            <Text style={styles.billingValue}>₹{booking.rental_amount}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Security Deposit Held:</Text>
            <Text style={styles.billingValue}>₹{booking.deposit_amount}</Text>
          </View>
          <View style={styles.billingRow}>
            <Text style={styles.billingLabel}>Daily Rental Rate:</Text>
            <Text style={styles.billingValue}>₹{booking.daily_rate} / day</Text>
          </View>
        </View>

        {/* PRIMARY RIDE ACTIONS */}
        <Text style={styles.sectionHeader}>Ride Management</Text>
        <View style={styles.actionsContainer}>
          <EVButton
            title="Extend Rental Duration"
            onPress={() =>
              navigation.navigate('ExtendBooking', { bookingId: booking.id })
            }
            variant="primary"
            size="md"
            icon={<Clock size={16} color="#080C0E" strokeWidth={2.5} />}
          />

          <EVButton
            title="Request Vehicle Replacement"
            onPress={() => setShowChangeModal(true)}
            variant="secondary"
            size="md"
            icon={<RotateCcw size={16} color={colors.textPrimary} />}
          />

          <EVButton
            title="Return Scooter & Settle Dues"
            onPress={handleReturnVehicle}
            loading={returning}
            variant="outline"
            size="md"
            icon={<LogOut size={16} color={colors.primary} />}
          />
        </View>
      </ScrollView>

      {/* EXPIRY NOTIFICATION SIMULATION MODAL */}
      <Modal
        visible={showExpiryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExpiryModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.bellIconBox}>
              <Bell size={28} color="#080C0E" />
            </View>
            <Text style={styles.modalTitle}>Rental Expiry Reminder</Text>
            <Text style={styles.modalBody}>
              Your EVSMITH rental expires on {formattedEndDate}. Would you like to extend your booking now to ensure uninterrupted mobility?
            </Text>

            <View style={styles.modalBtnRow}>
              <EVButton
                title="OK / Later"
                onPress={() => setShowExpiryModal(false)}
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
              />
              <EVButton
                title="Extend Now"
                onPress={() => {
                  setShowExpiryModal(false);
                  navigation.navigate('ExtendBooking', { bookingId: booking.id });
                }}
                variant="primary"
                size="sm"
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* VEHICLE CHANGE / REPLACEMENT MODAL */}
      <Modal
        visible={showChangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <Text style={styles.modalTitle}>Vehicle Replacement Request</Text>
            <Text style={styles.modalSubtitle}>
              Submit a swap request if you need a different scooter or variant.
            </Text>

            <ScrollView style={{ width: '100%' }}>
              <EVInput
                label="Reason for Vehicle Change"
                required
                value={changeReason}
                onChangeText={setChangeReason}
                multiline
              />

              <Text style={styles.modalFieldLabel}>Preferred Payment Mode</Text>
              <View style={styles.paymentModeRow}>
                <TouchableOpacity
                  style={[
                    styles.modeChip,
                    paymentMode === 'ONLINE' && styles.modeChipActive,
                  ]}
                  onPress={() => setPaymentMode('ONLINE')}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      paymentMode === 'ONLINE' && styles.modeChipTextActive,
                    ]}
                  >
                    Online (UPI / Card)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modeChip,
                    paymentMode === 'CASH' && styles.modeChipActive,
                  ]}
                  onPress={() => setPaymentMode('CASH')}
                >
                  <Text
                    style={[
                      styles.modeChipText,
                      paymentMode === 'CASH' && styles.modeChipTextActive,
                    ]}
                  >
                    Cash at Station
                  </Text>
                </TouchableOpacity>
              </View>

              <EVInput
                label="Pre-existing Damage / Remarks"
                value={damageRemarks}
                onChangeText={setDamageRemarks}
                multiline
              />

              <EVButton
                title="Submit Replacement Request"
                onPress={handleSubmitVehicleChange}
                loading={submittingChange}
                variant="primary"
                size="md"
                style={{ marginTop: spacing.md }}
              />

              <EVButton
                title="Cancel"
                onPress={() => setShowChangeModal(false)}
                variant="ghost"
                size="sm"
                style={{ marginTop: spacing.xs }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 6,
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  activePillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  heroImage: {
    width: '100%',
    height: 190,
  },
  heroContent: {
    padding: spacing.md,
  },
  heroTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  vehicleTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  vehicleReg: {
    color: colors.primary,
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    marginTop: 2,
  },
  hubBadge: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  hubText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  telemetryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  telemetryItem: {
    alignItems: 'center',
    flex: 1,
  },
  telemetryVal: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  telemetryLbl: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  telemetryDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.surfaceBorder,
  },
  countdownCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  countdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.sm,
  },
  countdownTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  countdownHighlight: {
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.25)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
  },
  countdownDays: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  countdownDate: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  countdownSub: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  billingCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    gap: spacing.xs + 2,
  },
  billingTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billingLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  billingValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  actionsContainer: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
  },
  bellIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.warning,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: spacing.md,
  },
  modalBody: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginVertical: spacing.md,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    width: '100%',
  },
  modalFieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  paymentModeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  modeChip: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  modeChipActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
  },
  modeChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  modeChipTextActive: {
    color: colors.primary,
  },
});
