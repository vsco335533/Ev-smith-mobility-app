import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  BatteryCharging,
  Zap,
  Gauge,
  MapPin,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { apiClient } from '../../api/client';
import { Vehicle } from '../../types';

interface VehicleDetailScreenProps {
  route: any;
  navigation: any;
}

export const VehicleDetailScreen: React.FC<VehicleDetailScreenProps> = ({
  route,
  navigation,
}) => {
  const { vehicleId } = route.params;
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await apiClient.get(`/vehicles/${vehicleId}`);
        setVehicle(res.data);
      } catch (err) {
        console.log('Error fetching vehicle details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [vehicleId]);

  if (loading || !vehicle) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const featuresList = vehicle.features
    ? vehicle.features.split(',').map((f) => f.trim())
    : ['Fast DC Charging', 'Smart GPS Telemetry', 'Dual Disc Brakes', 'Regenerative Braking'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Floating Back Button */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: vehicle.image_url }}
            style={styles.image}
            resizeMode="cover"
          />
          <TouchableOpacity
            style={styles.floatingBackBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {/* Title & Station */}
          <View style={styles.titleSection}>
            <View>
              <Text style={styles.title}>
                {vehicle.make} {vehicle.model}
              </Text>
              <Text style={styles.variant}>{vehicle.variant}</Text>
            </View>
            <View style={styles.priceContainer}>
              <Text style={styles.price}>₹{vehicle.daily_rate}</Text>
              <Text style={styles.priceUnit}>/ day</Text>
            </View>
          </View>

          {/* Registration & Security Deposit */}
          <View style={styles.regBadgeRow}>
            <Text style={styles.regNumber}>Reg: {vehicle.registration_number}</Text>
            <Text style={styles.depositBadge}>
              Security Deposit: ₹{vehicle.deposit_amount}
            </Text>
          </View>

          {/* Key EV Performance Specs */}
          <View style={styles.specsGrid}>
            <View style={styles.specBox}>
              <BatteryCharging size={20} color={colors.primary} />
              <Text style={styles.specVal}>{vehicle.battery_percentage}%</Text>
              <Text style={styles.specLbl}>Battery Status</Text>
            </View>
            <View style={styles.specBox}>
              <Zap size={20} color={colors.secondary} />
              <Text style={styles.specVal}>{vehicle.range_km} km</Text>
              <Text style={styles.specLbl}>Estimated Range</Text>
            </View>
            <View style={styles.specBox}>
              <Gauge size={20} color="#B57EDC" />
              <Text style={styles.specVal}>{vehicle.top_speed_kmh} km/h</Text>
              <Text style={styles.specLbl}>Top Speed</Text>
            </View>
          </View>

          {/* Station / Pickup Hub Info */}
          <View style={styles.stationCard}>
            <View style={styles.stationHeader}>
              <MapPin size={18} color={colors.primary} />
              <Text style={styles.stationTitle}>Pickup & Handover Hub</Text>
            </View>
            <Text style={styles.stationName}>
              {vehicle.station?.name || vehicle.station_name || 'HITEC City Main Hub'}
            </Text>
            <Text style={styles.stationAddress}>
              {vehicle.station?.address || 'Cyber Towers Junction, Madhapur, Hyderabad'}
            </Text>
          </View>

          {/* Features */}
          <Text style={styles.sectionHeader}>Scooter Highlights</Text>
          <View style={styles.featuresList}>
            {featuresList.map((feat, idx) => (
              <View key={idx} style={styles.featureRow}>
                <CheckCircle2 size={16} color={colors.primary} />
                <Text style={styles.featureText}>{feat}</Text>
              </View>
            ))}
          </View>

          {/* Safety & Compliance */}
          <View style={styles.insuranceBanner}>
            <ShieldCheck size={20} color={colors.secondary} />
            <Text style={styles.insuranceText}>
              Includes 24/7 Roadside Assistance & Comprehensive Vehicle Insurance.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.barPrice}>₹{vehicle.daily_rate} / day</Text>
          <Text style={styles.barDeposit}>+ ₹{vehicle.deposit_amount} Deposit</Text>
        </View>
        <EVButton
          title="Request Ride"
          onPress={() =>
            navigation.navigate('BookingRequest', { vehicleId: vehicle.id })
          }
          variant="primary"
          size="md"
          style={styles.requestBtn}
        />
      </View>
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
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: 260,
    backgroundColor: '#070A0C',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  floatingBackBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(8, 12, 14, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: spacing.lg,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  variant: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  price: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '800',
  },
  priceUnit: {
    color: colors.textMuted,
    fontSize: 12,
  },
  regBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  regNumber: {
    color: colors.textSecondary,
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  depositBadge: {
    color: colors.textMuted,
    fontSize: 12,
  },
  specsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  specBox: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  specVal: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  specLbl: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  stationCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: spacing.xs,
  },
  stationTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  stationName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  stationAddress: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  featuresList: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  insuranceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 210, 255, 0.08)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 255, 0.25)',
    gap: spacing.sm,
  },
  insuranceText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  barPrice: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '800',
  },
  barDeposit: {
    color: colors.textMuted,
    fontSize: 11,
  },
  requestBtn: {
    paddingHorizontal: spacing.xl,
  },
});
