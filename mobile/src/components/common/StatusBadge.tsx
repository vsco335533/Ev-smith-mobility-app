import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { BookingStatus } from '../../types';
import { colors, borderRadius, spacing } from '../../theme';

interface StatusBadgeProps {
  status: BookingStatus | string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending Review', color: colors.warning, bg: colors.warningMuted },
  UNDER_REVIEW: { label: 'Under Review', color: colors.warning, bg: colors.warningMuted },
  APPROVED: { label: 'Approved', color: colors.secondary, bg: colors.secondaryMuted },
  AGREEMENT_REQUIRED: { label: 'Agreement Required', color: colors.secondary, bg: colors.secondaryMuted },
  HANDOVER_REQUIRED: { label: 'Vehicle Handover', color: '#B57EDC', bg: 'rgba(181, 126, 220, 0.15)' },
  ACTIVE: { label: 'Active Ride', color: colors.primary, bg: colors.primaryMuted },
  EXTENSION_REQUESTED: { label: 'Extension Requested', color: colors.secondary, bg: colors.secondaryMuted },
  VEHICLE_CHANGE_REQUESTED: { label: 'Change Requested', color: '#FFA500', bg: 'rgba(255, 165, 0, 0.15)' },
  RETURN_PENDING: { label: 'Return Pending', color: colors.warning, bg: colors.warningMuted },
  SETTLEMENT_PENDING: { label: 'Settlement Pending', color: '#00D2FF', bg: 'rgba(0, 210, 255, 0.15)' },
  COMPLETED: { label: 'Completed', color: colors.primary, bg: colors.primaryMuted },
  REJECTED: { label: 'Rejected', color: colors.error, bg: colors.errorMuted },
  CANCELLED: { label: 'Cancelled', color: colors.textMuted, bg: 'rgba(100, 116, 139, 0.15)' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    color: colors.textSecondary,
    bg: colors.surfaceLight,
  };

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        size === 'md' && styles.badgeMd,
      ]}
    >
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text
        style={[
          styles.text,
          { color: config.color },
          size === 'md' && styles.textMd,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeMd: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  textMd: {
    fontSize: 12,
  },
});
