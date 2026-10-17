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
  Receipt,
  Sparkles,
  Zap,
  ShieldCheck,
  Check,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { apiClient } from '../../api/client';
import { Booking } from '../../types';

interface FinalSettlementScreenProps {
  route: any;
  navigation: any;
}

export const FinalSettlementScreen: React.FC<FinalSettlementScreenProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Rider confirmation checkbox
  const [confirmed, setConfirmed] = useState(false);

  // Completion state
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const res = await apiClient.get(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        console.log('Error loading settlement data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  const handleCloseBooking = async () => {
    if (!confirmed) {
      Alert.alert('Acknowledgement Required', 'Please confirm and accept the settlement breakdown.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/bookings/${bookingId}/settlement-acknowledge`, {
        rider_acknowledged: true,
      });
      setIsCompleted(true);
    } catch (err: any) {
      Alert.alert('Settlement Error', err.message || 'Unable to close booking.');
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

  const settlement = booking.settlement || {
    base_rental_amount: booking.rental_amount,
    extension_amount: 0,
    damage_charges: 0,
    late_days: 0,
    late_charges: 0,
    other_charges: 0,
    security_deposit_held: booking.deposit_amount,
    refund_amount: booking.deposit_amount,
    net_payable_amount: 0,
  };

  // BOOKING CLOSED ANIMATED COMPLETION EXPERIENCE
  if (isCompleted || booking.status === 'COMPLETED') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completionContainer}>
          <View style={styles.completionBadge}>
            <Sparkles size={44} color="#080C0E" />
          </View>
          <Text style={styles.completionTitle}>Ride Completed</Text>
          <Text style={styles.completionSub}>
            Thank you for riding electric with EVSMITH.
          </Text>

          <View style={styles.closedCard}>
            <View style={styles.closedBadgeRow}>
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={styles.closedBadgeText}>Booking Closed Successfully</Text>
            </View>

            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Booking Reference:</Text>
              <Text style={styles.summaryVal}>#{booking.booking_number}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>EV Scooter:</Text>
              <Text style={styles.summaryVal}>
                {booking.vehicle?.make} {booking.vehicle?.model}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Security Deposit Refund:</Text>
              <Text style={[styles.summaryVal, { color: colors.primary }]}>
                ₹{settlement.refund_amount}
              </Text>
            </View>
            <Text style={styles.refundNote}>
              Your refund will be credited back to your original payment source within 2 business days.
            </Text>
          </View>

          <View style={{ width: '100%', gap: spacing.sm }}>
            <EVButton
              title="View In Booking History"
              onPress={() => navigation.replace('History')}
              variant="primary"
              size="lg"
            />
            <EVButton
              title="Back to Dashboard"
              onPress={() => navigation.replace('MainTabs')}
              variant="ghost"
              size="md"
            />
          </View>
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
          <Text style={styles.headerTitle}>Final Settlement</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Statement Header */}
        <View style={styles.statementHeader}>
          <Receipt size={24} color={colors.primary} />
          <View>
            <Text style={styles.statementTitle}>EVSMITH Rental Settlement</Text>
            <Text style={styles.statementRef}>Ref: #{booking.booking_number}</Text>
          </View>
        </View>

        {/* Breakdown Card */}
        <View style={styles.breakdownCard}>
          <Text style={styles.cardHeader}>Billing Statement</Text>

          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>Base Rental Charges ({booking.duration_days} Days)</Text>
            <Text style={styles.lineValue}>₹{settlement.base_rental_amount}</Text>
          </View>

          {settlement.extension_amount > 0 && (
            <View style={styles.lineItem}>
              <Text style={styles.lineLabel}>Approved Extensions</Text>
              <Text style={styles.lineValue}>+ ₹{settlement.extension_amount}</Text>
            </View>
          )}

          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>Damage Deductions</Text>
            <Text style={[styles.lineValue, settlement.damage_charges > 0 && { color: colors.error }]}>
              ₹{settlement.damage_charges}
            </Text>
          </View>

          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>
              Late Return Surcharge ({settlement.late_days} days @ ₹100/d)
            </Text>
            <Text style={[styles.lineValue, settlement.late_charges > 0 && { color: colors.error }]}>
              ₹{settlement.late_charges}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.lineItem}>
            <Text style={styles.lineLabel}>Security Deposit Held</Text>
            <Text style={styles.lineValue}>₹{settlement.security_deposit_held}</Text>
          </View>

          <View style={styles.divider} />

          {/* Refund vs Payable Highlight */}
          {settlement.refund_amount > 0 ? (
            <View style={styles.netRefundRow}>
              <View>
                <Text style={styles.netRefundTitle}>Amount Refundable</Text>
                <Text style={styles.netRefundSub}>Direct to original bank account</Text>
              </View>
              <Text style={styles.netRefundAmount}>₹{settlement.refund_amount}</Text>
            </View>
          ) : (
            <View style={styles.netPayableRow}>
              <View>
                <Text style={styles.netPayableTitle}>Amount To Be Paid</Text>
                <Text style={styles.netPayableSub}>Outstanding dues</Text>
              </View>
              <Text style={styles.netPayableAmount}>₹{settlement.net_payable_amount}</Text>
            </View>
          )}
        </View>

        {/* Rider Acknowledgement Checkbox */}
        <TouchableOpacity
          style={styles.ackBox}
          onPress={() => setConfirmed(!confirmed)}
          activeOpacity={0.8}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <CheckCircle2 size={16} color="#080C0E" strokeWidth={3} />}
          </View>
          <Text style={styles.ackText}>
            I confirm that the above vehicle condition and final settlement details have been reviewed and accepted.
          </Text>
        </TouchableOpacity>

        <EVButton
          title="Close Booking & Complete"
          onPress={handleCloseBooking}
          loading={submitting}
          disabled={!confirmed}
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
  statementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  statementTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  statementRef: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  cardHeader: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lineLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  lineValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.surfaceBorder,
    marginVertical: spacing.xs,
  },
  netRefundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  netRefundTitle: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  netRefundSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  netRefundAmount: {
    color: colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  netPayableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  netPayableTitle: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
  netPayableSub: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  netPayableAmount: {
    color: colors.error,
    fontSize: 22,
    fontWeight: '800',
  },
  ackBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.inputBg,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  ackText: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    marginBottom: spacing.xxl,
  },
  completionContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 14,
  },
  completionTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
  },
  completionSub: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
    marginBottom: spacing.xl,
  },
  closedCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  closedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  closedBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
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
  summaryVal: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  refundNote: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
});
