import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Phone, User as UserIcon, KeyRound, ShieldAlert } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 6-digit OTP Modal State
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const otpInputsRef = useRef<Array<TextInput | null>>([]);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [sandboxOtp, setSandboxOtp] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);

  const handleDigitChange = (text: string, index: number) => {
    setOtpError(null);
    const cleaned = text.replace(/[^0-9]/g, '');

    // Handle full OTP paste
    if (cleaned.length > 1) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = cleaned[i] || '';
      }
      setOtpDigits(newDigits);
      setOtpValue(newDigits.join(''));
      const focusTarget = Math.min(cleaned.length, 5);
      otpInputsRef.current[focusTarget]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);
    setOtpValue(newDigits.join(''));

    // Auto-advance to next box
    if (cleaned && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        setOtpValue(newDigits.join(''));
        otpInputsRef.current[index - 1]?.focus();
      }
    }
  };

  const loginUser = useAuthStore((state) => state.login);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Full Name must be at least 2 characters (as on official ID).';
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errs.phone = 'Please enter a valid 10-digit mobile number.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validate()) return;
    setLoading(true);
    setErrors({});
    try {
      const res = await apiClient.post('/auth/send-otp', {
        email: email.trim().toLowerCase(),
        purpose: 'registration',
      });
      if (res.data.is_sandbox && res.data.sandbox_otp) {
        setSandboxOtp(res.data.sandbox_otp);
        setOtpValue(res.data.sandbox_otp);
        setOtpDigits(res.data.sandbox_otp.slice(0, 6).split(''));
      } else {
        setSandboxOtp(null);
        setOtpValue('');
        setOtpDigits(['', '', '', '', '', '']);
      }
      setOtpModalVisible(true);
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 300);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to send OTP. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpAndRegister = async () => {
    if (otpValue.length !== 6) {
      setOtpError('Please enter a 6-digit OTP.');
      return;
    }
    setOtpLoading(true);
    setOtpError(null);

    try {
      // 1. Verify OTP
      await apiClient.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otp: otpValue,
      });

      // 2. Register Account
      const regRes = await apiClient.post('/auth/register', {
        full_name: fullName.trim(),
        phone: phone.replace(/[^0-9]/g, ''),
        email: email.trim().toLowerCase(),
      });

      const data = regRes.data;
      loginUser(data.access_token, data.refresh_token, {
        id: data.user_id,
        email: data.email,
        phone: phone.replace(/[^0-9]/g, ''),
        role: data.role,
        must_change_password: data.must_change_password,
        is_profile_complete: false,
        full_name: data.full_name,
      });

      setOtpModalVisible(false);
      // Navigate to 5-step Rider Registration
      navigation.replace('RiderRegistration', {
        initialName: fullName.trim(),
        initialPhone: phone.replace(/[^0-9]/g, ''),
        initialEmail: email.trim().toLowerCase(),
      });
    } catch (err: any) {
      setOtpError(err.message || 'Verification failed. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Rider Account</Text>
            <Text style={styles.subtitle}>
              Register with your legal name as it appears on your Driving Licence / Government ID.
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <EVInput
              label="Full Legal Name"
              required
              placeholder="e.g. Anudeep Varma"
              value={fullName}
              onChangeText={setFullName}
              error={errors.fullName}
              leftElement={<UserIcon size={18} color={colors.textSecondary} />}
            />

            <EVInput
              label="Mobile Number"
              required
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={phone}
              onChangeText={setPhone}
              error={errors.phone}
              leftElement={<Phone size={18} color={colors.textSecondary} />}
            />

            <EVInput
              label="Email Address"
              required
              placeholder="rider@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              leftElement={<Mail size={18} color={colors.textSecondary} />}
            />

            <View style={styles.infoNotice}>
              <ShieldAlert size={16} color={colors.secondary} />
              <Text style={styles.infoNoticeText}>
                Your registered mobile number will be your initial login password.
              </Text>
            </View>

            <EVButton
              title="Verify Email & Continue"
              onPress={handleSendOtp}
              loading={loading}
              variant="primary"
              size="lg"
              style={styles.submitBtn}
            />

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already registered?</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                activeOpacity={0.7}
              >
                <Text style={styles.loginLink}> Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bravo Email OTP Modal */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setOtpModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.otpIconBadge}>
              <KeyRound size={24} color="#080C0E" strokeWidth={2.5} />
            </View>

            <Text style={styles.modalTitle}>Bravo Email Verification</Text>
            <Text style={styles.modalSubtitle}>
              We have sent a 6-digit verification code to {'\n'}
              <Text style={{ color: colors.primary, fontWeight: '700' }}>{email}</Text>
            </Text>

            {sandboxOtp ? (
              <View style={styles.sandboxPill}>
                <Text style={styles.sandboxLabel}>[DEV / SANDBOX OTP]:</Text>
                <Text style={styles.sandboxCode}>{sandboxOtp}</Text>
              </View>
            ) : null}

            {/* 6 Individual OTP Boxes */}
            <View style={styles.otpBoxesContainer}>
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const val = otpDigits[idx] || '';
                const isFocused = focusedIndex === idx;
                return (
                  <View
                    key={idx}
                    style={[
                      styles.otpBox,
                      val ? styles.otpBoxFilled : null,
                      isFocused ? styles.otpBoxFocused : null,
                      otpError ? styles.otpBoxError : null,
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        otpInputsRef.current[idx] = ref;
                      }}
                      style={styles.otpDigitText}
                      keyboardType="number-pad"
                      maxLength={6}
                      value={val}
                      selectTextOnFocus
                      onFocus={() => setFocusedIndex(idx)}
                      onBlur={() => setFocusedIndex(null)}
                      onChangeText={(txt) => handleDigitChange(txt, idx)}
                      onKeyPress={(e) => handleKeyPress(e, idx)}
                    />
                  </View>
                );
              })}
            </View>

            {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}

            <EVButton
              title="Confirm & Register"
              onPress={handleVerifyOtpAndRegister}
              loading={otpLoading}
              variant="primary"
              size="md"
              style={styles.verifyBtn}
            />

            <TouchableOpacity
              onPress={handleSendOtp}
              style={styles.resendBtn}
              activeOpacity={0.7}
            >
              <Text style={styles.resendText}>Resend OTP code</Text>
            </TouchableOpacity>
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
    marginBottom: spacing.xl,
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
  form: {
    gap: spacing.xs,
  },
  infoNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  infoNoticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  submitBtn: {
    marginTop: spacing.md,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  loginText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
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
  otpIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  sandboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    gap: 6,
  },
  sandboxLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sandboxCode: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: spacing.md,
    gap: 6,
  },
  otpBox: {
    flex: 1,
    height: 54,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.surfaceBorder,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
  },
  otpBoxError: {
    borderColor: colors.error,
  },
  otpDigitText: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  otpErrorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  verifyBtn: {
    width: '100%',
    marginTop: spacing.md,
  },
  resendBtn: {
    marginTop: spacing.md,
  },
  resendText: {
    color: colors.textSecondary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
