import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Clock, ArrowRight, Calendar, MapPin } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { StatusBadge } from '../../components/common/StatusBadge';
import { apiClient } from '../../api/client';
import { Booking } from '../../types';

interface BookingHistoryScreenProps {
  navigation: any;
}

export const BookingHistoryScreen: React.FC<BookingHistoryScreenProps> = ({
  navigation,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  const fetchBookings = async () => {
    try {
      const res = await apiClient.get('/bookings');
      setBookings(res.data);
    } catch (err) {
      console.log('Error fetching history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  const filtered = bookings.filter((b) => {
    if (filter === 'ACTIVE') {
      return ![ 'COMPLETED', 'CANCELLED', 'REJECTED' ].includes(b.status);
    }
    if (filter === 'COMPLETED') {
      return b.status === 'COMPLETED';
    }
    return true;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Ride History</Text>
        <Text style={styles.subtitle}>All past & ongoing EV scooter bookings</Text>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tabsRow}>
        {(['ALL', 'ACTIVE', 'COMPLETED'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, filter === tab && styles.tabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text
              style={[
                styles.tabText,
                filter === tab && styles.tabTextActive,
              ]}
            >
              {tab === 'ALL' ? 'All Rides' : tab === 'ACTIVE' ? 'Active / Ongoing' : 'Completed'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Clock size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Bookings Found</Text>
            <Text style={styles.emptySub}>
              {filter === 'ACTIVE'
                ? 'You do not have any active or pending rides.'
                : 'Your booking records will appear here.'}
            </Text>
          </View>
        ) : (
          filtered.map((b) => (
            <TouchableOpacity
              key={b.id}
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('BookingTimeline', { bookingId: b.id })
              }
            >
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.bookingRef}>#{b.booking_number}</Text>
                  <Text style={styles.vehicleName}>
                    {b.vehicle?.make} {b.vehicle?.model}
                  </Text>
                </View>
                <StatusBadge status={b.status} size="sm" />
              </View>

              <View style={styles.cardMeta}>
                <View style={styles.metaItem}>
                  <Calendar size={13} color={colors.textMuted} />
                  <Text style={styles.metaText}>{b.duration_days} Days</Text>
                </View>
                <View style={styles.metaItem}>
                  <MapPin size={13} color={colors.textMuted} />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {b.station?.name || 'Hyderabad Station'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <Text style={styles.amountText}>₹{b.total_amount}</Text>
                <View style={styles.viewLink}>
                  <Text style={styles.viewLinkText}>View Journey</Text>
                  <ArrowRight size={14} color={colors.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabActive: {
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  bookingRef: {
    color: colors.primary,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  vehicleName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginVertical: spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  amountText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  viewLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewLinkText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySub: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
});
