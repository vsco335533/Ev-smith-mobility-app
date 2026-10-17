import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, User as UserIcon, ShieldAlert } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

interface LoginScreenProps {
  navigation: any;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginUser = useAuthStore((state) => state.login);

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Please enter both your Email / Mobile Number and Password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiClient.post('/auth/login', {
        identifier: identifier.trim(),
        password: password.trim(),
      });

      const data = res.data;
      loginUser(data.access_token, data.refresh_token, {
        id: data.user_id,
        email: data.email,
        phone: identifier.replace(/[^0-9]/g, '') || data.email,
        role: data.role,
        must_change_password: data.must_change_password,
        is_profile_complete: data.is_profile_complete,
        full_name: data.full_name,
      });

      // Navigate based on profile status
      if (!data.is_profile_complete && data.role === 'RIDER') {
        navigation.replace('RiderRegistration', {
          initialName: data.full_name,
          initialEmail: data.email,
        });
      } else {
        navigation.replace('MainTabs');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (role: 'rider' | 'admin') => {
    if (role === 'admin') {
      setIdentifier('admin@evsmith.com');
      setPassword('Admin@EVSmith2026!');
    } else {
      setIdentifier('rider@evsmith.com');
      setPassword('9123456780');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to manage your EV bookings and access active rides.
            </Text>
          </View>

          {/* Quick Demo Test Buttons */}
          <View style={styles.quickFillCard}>
            <Text style={styles.quickFillTitle}>Quick Demo Credentials:</Text>
            <View style={styles.quickFillBtns}>
              <TouchableOpacity
                style={styles.chip}
                onPress={() => handleQuickFill('rider')}
              >
                <Text style={styles.chipText}>Demo Rider</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.chip, styles.chipAdmin]}
                onPress={() => handleQuickFill('admin')}
              >
                <Text style={[styles.chipText, styles.chipAdminText]}>Super Admin</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.form}>
            <EVInput
              label="Email ID or Mobile Number"
              required
              placeholder="e.g. 9123456780 or rider@evsmith.com"
              autoCapitalize="none"
              value={identifier}
              onChangeText={setIdentifier}
              leftElement={<UserIcon size={18} color={colors.textSecondary} />}
            />

            <EVInput
              label="Password"
              required
              placeholder="Enter your password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              leftElement={<Lock size={18} color={colors.textSecondary} />}
            />

            <View style={styles.infoNotice}>
              <ShieldAlert size={16} color={colors.primary} />
              <Text style={styles.infoNoticeText}>
                First time logging in? Your registered mobile number is your initial password.
              </Text>
            </View>

            {error ? <Text style={styles.errorBanner}>{error}</Text> : null}

            <EVButton
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.registerRow}>
              <Text style={styles.registerText}>New to EVSMITH?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Register')}
                activeOpacity={0.7}
              >
                <Text style={styles.registerLink}> Register Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  titleSection: {
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs + 2,
    lineHeight: 20,
  },
  quickFillCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  quickFillTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  quickFillBtns: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  chipText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  chipAdmin: {
    borderColor: colors.secondary,
  },
  chipAdminText: {
    color: colors.secondary,
  },
  form: {
    gap: spacing.xs,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.25)',
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  infoNoticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  errorBanner: {
    color: colors.error,
    backgroundColor: colors.errorMuted,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: 13,
    fontWeight: '600',
    marginVertical: spacing.xs,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  registerText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  registerLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
});
