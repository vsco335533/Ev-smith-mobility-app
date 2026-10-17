import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Zap,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowRight,
  BatteryCharging,
  SlidersHorizontal,
  User,
  Sparkles,
  Phone,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { VehicleCard } from '../../components/vehicle/VehicleCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { EVButton } from '../../components/common/EVButton';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppContentStore, DEFAULT_PAGE_CONTENT } from '../../store/useAppContentStore';
import { Vehicle, Booking, Station } from '../../types';

interface DashboardScreenProps {
  navigation: any;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const pages = useAppContentStore((state) => state.pages);
  const fetchCMSContent = useAppContentStore((state) => state.fetchContent);
  const fleetContent = pages.fleet || DEFAULT_PAGE_CONTENT.fleet;
  const supportContent = pages.support || DEFAULT_PAGE_CONTENT.support;
  const helplinePhone = fleetContent.content_data?.support_phone || supportContent.content_data?.support_phone || '+91 98765 43210';

  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);

  const fetchDashboardData = async () => {
    try {
      // 1. Fetch Fleet
      const vehiclesRes = await apiClient.get('/vehicles');
      setVehicles(vehiclesRes.data);

      // 2. Fetch Stations
      const stationsRes = await apiClient.get('/vehicles/stations');
      setStations(stationsRes.data);

      // 3. Fetch User's latest booking
      if (user?.role === 'RIDER') {
        const bookingsRes = await apiClient.get('/bookings');
        const userBookings: Booking[] = bookingsRes.data;
        const ongoing = userBookings.find((b) =>
          [
            'PENDING',
            'UNDER_REVIEW',
            'APPROVED',
            'AGREEMENT_REQUIRED',
            'HANDOVER_REQUIRED',
            'ACTIVE',
            'EXTENSION_REQUESTED',
            'VEHICLE_CHANGE_REQUESTED',
            'RETURN_PENDING',
            'SETTLEMENT_PENDING',
          ].includes(b.status)
        );
        setActiveBooking(ongoing || null);
      }
    } catch (err) {
      console.log('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      fetchCMSContent();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    fetchCMSContent();
  };

  const filteredVehicles = selectedStationId
    ? vehicles.filter((v) => v.station_id === selectedStationId)
    : vehicles;

  const firstName = user?.full_name?.split(' ')[0] || 'Rider';

  return (
    <SafeAreaView style={styles.container}>
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
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingText}>Hello, {firstName} 👋</Text>
            <View style={styles.statusRow}>
              <ShieldCheck size={14} color={colors.primary} />
              <Text style={styles.statusSubtext}>
                {user?.is_profile_complete ? 'KYC Verified Rider' : 'Verification In Progress'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.profileBadge}
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.8}
          >
            <Clock size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* PROMOTIONAL FLEET CMS BANNER */}
        {fleetContent.content_data?.banner_text ? (
          <View style={styles.promoBanner}>
            <View style={styles.promoBannerLeft}>
              <Sparkles size={14} color={colors.primary} />
              <Text style={styles.promoBannerText}>
                {fleetContent.content_data.banner_text}
              </Text>
            </View>
            {helplinePhone ? (
              <TouchableOpacity
                onPress={() => Linking.openURL(`tel:${helplinePhone.replace(/\s+/g, '')}`)}
                style={styles.helplineBtn}
                activeOpacity={0.8}
              >
                <Phone size={11} color="#080C0E" />
                <Text style={styles.helplineBtnText}>Help</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {/* ACTIVE / ONGOING BOOKING HERO CARD */}
        {activeBooking ? (
          <View style={styles.activeBookingCard}>
            <View style={styles.activeBookingHeader}>
              <View style={styles.activeBadgeRow}>
                <Zap size={14} color={colors.primary} fill={colors.primary} />
                <Text style={styles.activeBookingTitle}>CURRENT RIDE STATUS</Text>
              </View>
              <StatusBadge status={activeBooking.status} size="sm" />
            </View>

            <View style={styles.activeBookingBody}>
              <Image
                source={{
                  uri:
                    activeBooking.vehicle?.image_url ||
                    'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80',
                }}
                style={styles.activeScooterImg}
                resizeMode="cover"
              />
              <View style={styles.activeDetails}>
                <Text style={styles.activeModel}>
                  {activeBooking.vehicle?.make} {activeBooking.vehicle?.model}
                </Text>
                <Text style={styles.activeReg}>
                  {activeBooking.vehicle?.registration_number}
                </Text>

                <View style={styles.activeTelemetryRow}>
                  <View style={styles.telemetryItem}>
                    <BatteryCharging size={12} color={colors.primary} />
                    <Text style={styles.telemetryText}>
                      {activeBooking.vehicle?.battery_percentage || 95}%
                    </Text>
                  </View>
                  <View style={styles.telemetryItem}>
                    <Clock size={12} color={colors.secondary} />
                    <Text style={styles.telemetryText}>
                      {activeBooking.duration_days} Days
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.activeActionBtn}
              onPress={() =>
                navigation.navigate('BookingTimeline', { bookingId: activeBooking.id })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.activeActionText}>
                {activeBooking.status === 'AGREEMENT_REQUIRED'
                  ? 'Sign Rental Agreement'
                  : activeBooking.status === 'HANDOVER_REQUIRED'
                  ? 'Proceed to Vehicle Handover'
                  : activeBooking.status === 'ACTIVE'
                  ? 'Manage Active Ride'
                  : activeBooking.status === 'SETTLEMENT_PENDING'
                  ? 'Acknowledge Settlement'
                  : 'Track Booking Timeline'}
              </Text>
              <ArrowRight size={16} color="#080C0E" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.noRideCard}>
            <View style={styles.noRideIcon}>
              <Zap size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.noRideTitle}>No Active Rental</Text>
              <Text style={styles.noRideSubtitle}>
                Select an EV scooter below to start your electric ride.
              </Text>
            </View>
          </View>
        )}

        {/* Stations Filter Chips */}
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>
              {fleetContent.title || 'Available EV Fleet'}
            </Text>
            {fleetContent.subtitle ? (
              <Text style={styles.sectionSubtitleText}>
                {fleetContent.subtitle}
              </Text>
            ) : null}
          </View>
          <View style={styles.filterIcon}>
            <SlidersHorizontal size={14} color={colors.textSecondary} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stationChipsScroll}
        >
          <TouchableOpacity
            style={[
              styles.stationChip,
              selectedStationId === null && styles.stationChipActive,
            ]}
            onPress={() => setSelectedStationId(null)}
          >
            <Text
              style={[
                styles.stationChipText,
                selectedStationId === null && styles.stationChipTextActive,
              ]}
            >
              All Stations ({vehicles.length})
            </Text>
          </TouchableOpacity>

          {stations.map((st) => (
            <TouchableOpacity
              key={st.id}
              style={[
                styles.stationChip,
                selectedStationId === st.id && styles.stationChipActive,
              ]}
              onPress={() => setSelectedStationId(st.id)}
            >
              <Text
                style={[
                  styles.stationChipText,
                  selectedStationId === st.id && styles.stationChipTextActive,
                ]}
              >
                {st.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vehicle List */}
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Fetching available EV fleet...</Text>
          </View>
        ) : filteredVehicles.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No EV Scooters Available</Text>
            <Text style={styles.emptySubtitle}>
              All scooters at this station are currently rented. Please try another station.
            </Text>
          </View>
        ) : (
          filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              onPress={() =>
                navigation.navigate('VehicleDetail', { vehicleId: vehicle.id })
              }
              onRequestRide={() =>
                navigation.navigate('BookingRequest', { vehicleId: vehicle.id })
              }
            />
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
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greetingText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  statusSubtext: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  profileBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  activeBookingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.primaryGlow,
    marginBottom: spacing.xl,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  activeBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  activeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeBookingTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  activeBookingBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  activeScooterImg: {
    width: 80,
    height: 60,
    borderRadius: borderRadius.md,
  },
  activeDetails: {
    flex: 1,
  },
  activeModel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  activeReg: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  activeTelemetryRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  telemetryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  telemetryText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  activeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  activeActionText: {
    color: '#080C0E',
    fontSize: 13,
    fontWeight: '700',
  },
  noRideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  noRideIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noRideTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  noRideSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  filterIcon: {
    padding: 4,
  },
  stationChipsScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  stationChip: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  stationChipActive: {
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    borderColor: colors.primary,
  },
  stationChipText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  stationChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  loaderContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.25)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginBottom: spacing.md,
    gap: 8,
  },
  promoBannerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  promoBannerText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  helplineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  helplineBtnText: {
    color: '#080C0E',
    fontSize: 11,
    fontWeight: '800',
  },
  sectionSubtitleText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
});
