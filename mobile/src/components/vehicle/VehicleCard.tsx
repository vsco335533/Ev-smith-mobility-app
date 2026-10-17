import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { BatteryCharging, Gauge, MapPin, Zap } from 'lucide-react-native';
import { Vehicle } from '../../types';
import { colors, borderRadius, spacing } from '../../theme';
import { EVButton } from '../common/EVButton';

interface VehicleCardProps {
  vehicle: Vehicle;
  onPress: () => void;
  onRequestRide?: () => void;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onPress,
  onRequestRide,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: vehicle.image_url }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.stationBadge}>
          <MapPin size={12} color={colors.primary} />
          <Text style={styles.stationText} numberOfLines={1}>
            {vehicle.station_name || 'Hyderabad Station'}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{vehicle.status}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.modelText}>
              {vehicle.make} {vehicle.model}
            </Text>
            <Text style={styles.variantText}>{vehicle.variant}</Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.priceAmount}>₹{vehicle.daily_rate}</Text>
            <Text style={styles.pricePeriod}>/ day</Text>
          </View>
        </View>

        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <BatteryCharging size={16} color={colors.primary} />
            <Text style={styles.specValue}>{vehicle.battery_percentage}%</Text>
            <Text style={styles.specLabel}>Battery</Text>
          </View>

          <View style={styles.specDivider} />

          <View style={styles.specItem}>
            <Zap size={16} color={colors.secondary} />
            <Text style={styles.specValue}>{vehicle.range_km} km</Text>
            <Text style={styles.specLabel}>Range</Text>
          </View>

          <View style={styles.specDivider} />

          <View style={styles.specItem}>
            <Gauge size={16} color="#B57EDC" />
            <Text style={styles.specValue}>{vehicle.top_speed_kmh} km/h</Text>
            <Text style={styles.specLabel}>Top Speed</Text>
          </View>
        </View>

        <View style={styles.regRow}>
          <Text style={styles.regNumber}>Reg: {vehicle.registration_number}</Text>
          <Text style={styles.depositText}>Deposit: ₹{vehicle.deposit_amount}</Text>
        </View>

        {onRequestRide ? (
          <EVButton
            title="Book / Request Ride"
            onPress={onRequestRide}
            variant="primary"
            size="sm"
            style={styles.bookBtn}
          />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    position: 'relative',
    backgroundColor: '#070A0C',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  stationBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    left: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(8, 12, 14, 0.85)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  stationText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 229, 153, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    color: '#080C0E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  content: {
    padding: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modelText: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  variantText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  pricePeriod: {
    color: colors.textMuted,
    fontSize: 11,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  specItem: {
    alignItems: 'center',
    flex: 1,
  },
  specValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  specLabel: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  specDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.surfaceBorder,
  },
  regRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  regNumber: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  depositText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  bookBtn: {
    marginTop: spacing.xs,
  },
});
