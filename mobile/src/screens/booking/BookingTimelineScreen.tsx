import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  FileSignature,
  Key,
  ShieldAlert,
  Zap,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EVButton } from '../../components/common/EVButton';
import { apiClient } from '../../api/client';
import { Booking } from '../../types';

interface BookingTimelineScreenProps {
  route: any;
  navigation: any;
}

const TIMELINE_STEPS = [
  { key: 'SUBMITTED', label: 'Request Submitted' },
  { key: 'REVIEW', label: 'Super Admin Review' },
  { key: 'APPROVED', label: 'Request Approved' },
  { key: 'AGREEMENT', label: 'Rental Agreement' },
  { key: 'HANDOVER', label: 'Vehicle Handover' },
  { key: 'ACTIVE', label: 'Ride Active' },
  { key: 'RETURN', label: 'Return / Replacement' },
  { key: 'SETTLEMENT', label: 'Final Settlement' },
  { key: 'COMPLETED', label: 'Booking Closed' },
];

export const BookingTimelineScreen: React.FC<BookingTimelineScreenProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSimulating, setAdminSimulating] = useState(false);

  const fetchBooking = async () => {
    try {
      const res = await apiClient.get(`/bookings/${bookingId}`);
      setBooking(res.data);
    } catch (err) {
      console.log('Error fetching booking timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
    const interval = setInterval(fetchBooking, 5000);
    return () => clearInterval(interval);
  }, [bookingId]);

  // Quick Admin Approval Simulation for seamless end-to-end testing
  const handleSimulateAdminApproval = async () => {
    if (!booking) return;
    setAdminSimulating(true);
    try {
      // Login as admin temporarily or call admin endpoint
      const adminLogin = await apiClient.post('/auth/login', {
        identifier: 'admin@evsmith.com',
        password: 'Admin@EVSmith2026!',
      });
      const adminToken = adminLogin.data.access_token;

      await apiClient.post(
        `/admin/booking-requests/${booking.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      Alert.alert(
        'Admin Approved!',
        'Booking has been approved and advanced to Rental Agreement stage.'
      );
      fetchBooking();
    } catch (err: any) {
      Alert.alert('Simulation Error', err.message);
    } finally {
      setAdminSimulating(false);
    }
  };

  if (loading || !booking) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  // Calculate current progress index based on status
  const getStepProgressIndex = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 0;
      case 'UNDER_REVIEW':
        return 1;
      case 'APPROVED':
        return 2;
      case 'AGREEMENT_REQUIRED':
        return 3;
      case 'HANDOVER_REQUIRED':
        return 4;
      case 'ACTIVE':
      case 'EXTENSION_REQUESTED':
      case 'VEHICLE_CHANGE_REQUESTED':
        return 5;
      case 'RETURN_PENDING':
        return 6;
      case 'SETTLEMENT_PENDING':
        return 7;
      case 'COMPLETED':
        return 8;
      default:
        return 0;
    }
  };

  const currentIndex = getStepProgressIndex(booking.status);

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
          <Text style={styles.headerTitle}>Booking Journey</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Booking Card Banner */}
        <View style={styles.bookingCard}>
          <View style={styles.bookingHeaderRow}>
            <View>
              <Text style={styles.bookingNum}>#{booking.booking_number}</Text>
              <Text style={styles.vehicleName}>
                {booking.vehicle?.make} {booking.vehicle?.model}
              </Text>
            </View>
            <StatusBadge status={booking.status} size="md" />
          </View>

          <View style={styles.bookingDetailsRow}>
            <View>
              <Text style={styles.detailLbl}>Station</Text>
              <Text style={styles.detailVal}>
                {booking.station?.name || 'HITEC City Hub'}
              </Text>
            </View>
            <View>
              <Text style={styles.detailLbl}>Duration</Text>
              <Text style={styles.detailVal}>{booking.duration_days} Days</Text>
            </View>
            <View>
              <Text style={styles.detailLbl}>Amount</Text>
              <Text style={[styles.detailVal, { color: colors.primary }]}>
                ₹{booking.total_amount}
              </Text>
            </View>
          </View>
        </View>

        {/* PRIMARY CALL TO ACTION BASED ON STATUS */}
        {booking.status === 'AGREEMENT_REQUIRED' && (
          <View style={styles.actionPromptCard}>
            <FileSignature size={24} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionPromptTitle}>Rental Agreement Ready</Text>
              <Text style={styles.actionPromptSub}>
                Review 11 terms and apply your digital signature.
              </Text>
            </View>
            <EVButton
              title="Sign Now"
              onPress={() =>
                navigation.navigate('RentalAgreement', { bookingId: booking.id })
              }
              variant="primary"
              size="sm"
            />
          </View>
        )}

        {booking.status === 'HANDOVER_REQUIRED' && (
          <View style={styles.actionPromptCard}>
            <Key size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionPromptTitle}>Vehicle Handover</Text>
              <Text style={styles.actionPromptSub}>
                Visit station to perform condition inspection & take delivery.
              </Text>
            </View>
            <EVButton
              title="Inspect & Take"
              onPress={() =>
                navigation.navigate('VehicleHandover', { bookingId: booking.id })
              }
              variant="primary"
              size="sm"
            />
          </View>
        )}

        {booking.status === 'ACTIVE' && (
          <View style={styles.actionPromptCard}>
            <Zap size={24} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionPromptTitle}>Ride is Active!</Text>
              <Text style={styles.actionPromptSub}>
                View live telemetry, extend rental, or request return.
              </Text>
            </View>
            <EVButton
              title="View Ride"
              onPress={() =>
                navigation.navigate('ActiveBooking', { bookingId: booking.id })
              }
              variant="primary"
              size="sm"
            />
          </View>
        )}

        {booking.status === 'SETTLEMENT_PENDING' && (
          <View style={styles.actionPromptCard}>
            <ShieldCheck size={24} color={colors.secondary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.actionPromptTitle}>Final Settlement Statement</Text>
              <Text style={styles.actionPromptSub}>
                Review deductions, deposit refund, and close booking.
              </Text>
            </View>
            <EVButton
              title="Review"
              onPress={() =>
                navigation.navigate('FinalSettlement', { bookingId: booking.id })
              }
              variant="primary"
              size="sm"
            />
          </View>
        )}

        {/* QUICK ADMIN TESTING BAR */}
        {(booking.status === 'PENDING' || booking.status === 'UNDER_REVIEW') && (
          <View style={styles.adminSimCard}>
            <ShieldAlert size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.adminSimTitle}>Testing Shortcut (Super Admin):</Text>
              <Text style={styles.adminSimSub}>
                Approve request directly to test agreement & handover stages.
              </Text>
            </View>
            <EVButton
              title="Approve Request"
              onPress={handleSimulateAdminApproval}
              loading={adminSimulating}
              variant="secondary"
              size="sm"
            />
          </View>
        )}

        {/* Visual Lifecycle Stepper */}
        <Text style={styles.sectionHeader}>Lifecycle Progress</Text>
        <View style={styles.timelineCard}>
          {TIMELINE_STEPS.map((stepItem, idx) => {
            const isPassed = idx < currentIndex;
            const isCurrent = idx === currentIndex;

            return (
              <View key={stepItem.key} style={styles.timelineRow}>
                <View style={styles.markerColumn}>
                  <View
                    style={[
                      styles.markerCircle,
                      isPassed && styles.markerPassed,
                      isCurrent && styles.markerCurrent,
                    ]}
                  >
                    {isPassed ? (
                      <CheckCircle2 size={12} color="#080C0E" strokeWidth={3} />
                    ) : (
                      <View
                        style={[
                          styles.innerDot,
                          isCurrent && styles.innerDotCurrent,
                        ]}
                      />
                    )}
                  </View>
                  {idx < TIMELINE_STEPS.length - 1 && (
                    <View
                      style={[
                        styles.timelineLine,
                        isPassed && styles.timelineLinePassed,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                      isPassed && styles.stepLabelPassed,
                    ]}
                  >
                    {stepItem.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.stepStatusHint}>
                      Current State: {booking.status.replace(/_/g, ' ')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Audit Log / Status History Entries */}
        <Text style={[styles.sectionHeader, { marginTop: spacing.lg }]}>
          Audit & Status History
        </Text>
        <View style={styles.historyCard}>
          {booking.status_history && booking.status_history.length > 0 ? (
            booking.status_history.map((hist) => (
              <View key={hist.id} style={styles.historyItem}>
                <Clock size={14} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyStatus}>
                    {hist.new_status.replace(/_/g, ' ')}
                  </Text>
                  <Text style={styles.historyRemarks}>{hist.remarks}</Text>
                  <Text style={styles.historyTime}>
                    {new Date(hist.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noHistoryText}>No history records yet.</Text>
          )}
        </View>
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
  bookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  bookingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  bookingNum: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  vehicleName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },
  bookingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.md,
  },
  detailLbl: {
    color: colors.textMuted,
    fontSize: 11,
  },
  detailVal: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  actionPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  actionPromptTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  actionPromptSub: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  adminSimCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 176, 32, 0.1)',
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  adminSimTitle: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  adminSimSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  timelineCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  markerColumn: {
    alignItems: 'center',
    width: 28,
  },
  markerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerPassed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  markerCurrent: {
    borderColor: colors.primary,
    backgroundColor: '#003822',
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textMuted,
  },
  innerDotCurrent: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    width: 2,
    height: 32,
    backgroundColor: colors.surfaceBorder,
    marginVertical: 2,
  },
  timelineLinePassed: {
    backgroundColor: colors.primary,
  },
  timelineContent: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: 22,
  },
  stepLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  stepLabelPassed: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  stepLabelCurrent: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  stepStatusHint: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: spacing.sm,
  },
  historyStatus: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  historyRemarks: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  historyTime: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 3,
  },
  noHistoryText: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    padding: spacing.md,
  },
});
