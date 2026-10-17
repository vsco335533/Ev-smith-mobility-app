import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Zap, ShieldCheck, Cpu } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { useAppContentStore, DEFAULT_PAGE_CONTENT } from '../../store/useAppContentStore';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  navigation: any;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const pages = useAppContentStore((state) => state.pages);
  const fetchContent = useAppContentStore((state) => state.fetchContent);

  useFocusEffect(
    useCallback(() => {
      fetchContent();
    }, [])
  );

  useEffect(() => {
    fetchContent();
  }, []);

  const welcome = pages.welcome || DEFAULT_PAGE_CONTENT.welcome;
  const brandLogoUrl = welcome.content_data?.brand_logo_url || '';
  const brandName = welcome.content_data?.brand_name || 'EVSMITH';
  const brandAccent = welcome.content_data?.brand_accent || 'MOBILITY';
  let heroImage = welcome.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=900&auto=format&fit=crop&q=80';
  if (heroImage.includes('/raw/upload/')) {
    heroImage = heroImage.replace('/raw/upload/', '/image/upload/');
  }
  let cleanLogo = brandLogoUrl;
  if (cleanLogo.includes('/raw/upload/')) {
    cleanLogo = cleanLogo.replace('/raw/upload/', '/image/upload/');
  }

  const tagline = welcome.content_data?.tagline || welcome.subtitle || 'Power Your Journey. Ride Electric.';
  const ctaButton = welcome.content_data?.cta_button || 'Get Started / Register';
  const loginButton = welcome.content_data?.login_button || 'Sign In to Your Account';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Background glow effects */}
      <View style={styles.glowTop} />

      <View style={styles.content}>
        {/* Brand Header */}
        <View style={styles.header}>
          {cleanLogo ? (
            <View style={styles.logoImageContainer}>
              <Image
                source={{ uri: cleanLogo.trim() }}
                style={styles.brandLogoImage}
                resizeMode="contain"
              />
            </View>
          ) : (
            <View style={styles.logoBadge}>
              <Zap size={22} color="#080C0E" fill="#080C0E" />
            </View>
          )}
          <Text style={styles.brandTitle}>
            {brandName} <Text style={styles.brandAccent}>{brandAccent}</Text>
          </Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>

        {/* Hero Scooter Visual */}
        <View style={styles.heroImageContainer}>
          <Image
            source={{ uri: heroImage }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />

          {/* Floating Pill Highlights */}
          <View style={styles.floatingPillLeft}>
            <Cpu size={14} color={colors.primary} />
            <Text style={styles.pillText}>Smart Telemetry</Text>
          </View>

          <View style={styles.floatingPillRight}>
            <ShieldCheck size={14} color={colors.secondary} />
            <Text style={styles.pillText}>Insured Rides</Text>
          </View>
        </View>

        {/* Value Proposition */}
        <View style={styles.featuresRow}>
          <View style={styles.featureItem}>
            <Text style={styles.featureStat}>150km</Text>
            <Text style={styles.featureLabel}>Max Range</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Text style={styles.featureStat}>₹299/d</Text>
            <Text style={styles.featureLabel}>Starting Rate</Text>
          </View>
          <View style={styles.featureDivider} />
          <View style={styles.featureItem}>
            <Text style={styles.featureStat}>0s</Text>
            <Text style={styles.featureLabel}>Emissions</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <EVButton
            title={ctaButton}
            onPress={() => navigation.navigate('Register')}
            variant="primary"
            size="lg"
            style={styles.actionBtn}
          />
          <EVButton
            title={loginButton}
            onPress={() => navigation.navigate('Login')}
            variant="secondary"
            size="md"
            style={styles.actionBtn}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    alignSelf: 'center',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.primaryGlow,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  logoImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 4,
    height: 52,
    maxHeight: 60,
  },
  brandLogoImage: {
    width: 140,
    height: 48,
  },
  logoBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs + 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  brandTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  brandAccent: {
    color: colors.primary,
  },
  tagline: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: spacing.sm,
  },
  heroImageContainer: {
    width: '100%',
    height: height * 0.36,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: colors.cardBorder,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: 'rgba(8, 12, 14, 0.25)',
  },
  floatingPillLeft: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 33, 0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 6,
  },
  floatingPillRight: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(18, 26, 33, 0.92)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: 6,
  },
  pillText: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  featuresRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureStat: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  featureLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  featureDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.surfaceBorder,
  },
  footer: {
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  actionBtn: {
    width: '100%',
  },
});
