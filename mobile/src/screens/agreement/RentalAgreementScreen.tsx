import React, { useEffect, useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2, ShieldAlert, FileText, Check } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { EVDatePicker } from '../../components/common/EVDatePicker';
import { SignaturePad } from '../../components/signature/SignaturePad';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppContentStore, DEFAULT_PAGE_CONTENT, DEFAULT_AGREEMENT_TERMS } from '../../store/useAppContentStore';
import { Booking } from '../../types';

interface RentalAgreementScreenProps {
  route: any;
  navigation: any;
}

export const RentalAgreementScreen: React.FC<RentalAgreementScreenProps> = ({
  route,
  navigation,
}) => {
  const { bookingId } = route.params;
  const user = useAuthStore((state) => state.user);

  const pages = useAppContentStore((state) => state.pages);
  const fetchCMSContent = useAppContentStore((state) => state.fetchContent);
  const agreementContent = pages.agreement || DEFAULT_PAGE_CONTENT.agreement;
  const agreementData = agreementContent.content_data || {};
  const activeClauses = agreementData.terms_clauses && agreementData.terms_clauses.length > 0
    ? agreementData.terms_clauses
    : DEFAULT_AGREEMENT_TERMS;

  useFocusEffect(
    useCallback(() => {
      fetchCMSContent().catch(() => {});
    }, [])
  );

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Editable lessee fields - No dummy defaults, user must fill manually
  const [lesseeName, setLesseeName] = useState(user?.full_name || '');
  const [lesseePhone, setLesseePhone] = useState(user?.phone || '');
  const [lesseeDob, setLesseeDob] = useState('');
  const [lesseeAddress, setLesseeAddress] = useState('');

  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [termsAgreed, setTermsAgreed] = useState(false);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        const res = await apiClient.get(`/bookings/${bookingId}`);
        setBooking(res.data);
      } catch (err) {
        console.log('Error loading booking:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingId]);

  const handleSubmitAgreement = async () => {
    if (!lesseeName.trim()) {
      Alert.alert('Required Field', `Please enter your ${agreementData.label_legal_name || 'Full Legal Name'}.`);
      return;
    }
    if (!lesseePhone.trim()) {
      Alert.alert('Required Field', `Please enter your ${agreementData.label_contact_phone || 'Contact Mobile'} number.`);
      return;
    }
    if (!lesseeDob.trim()) {
      Alert.alert('Required Field', `Please select your ${agreementData.label_dob || 'Date of Birth'} using the calendar.`);
      return;
    }
    if (!lesseeAddress.trim()) {
      Alert.alert('Required Field', `Please enter your ${agreementData.label_address || 'Current Residential Address'}.`);
      return;
    }
    if (!signatureData) {
      Alert.alert('Signature Required', 'Please draw your digital signature on the signature pad and tap Confirm.');
      return;
    }
    if (!termsAgreed) {
      Alert.alert('Agreement Required', 'You must check the agreement confirmation box.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post(`/bookings/${bookingId}/agreement`, {
        lessee_name: lesseeName.trim(),
        lessee_phone: lesseePhone.trim(),
        lessee_dob: lesseeDob.trim(),
        lessee_address: lesseeAddress.trim(),
        signature_data: signatureData,
        agreed_to_terms: true,
      });

      Alert.alert(
        'Agreement Completed',
        'Rental Agreement has been signed and locked. You can now proceed to the EV station for vehicle handover!',
        [
          {
            text: 'Proceed to Handover',
            onPress: () =>
              navigation.replace('VehicleHandover', { bookingId }),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.message || 'Unable to submit agreement.');
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
          <Text style={styles.headerTitle}>{agreementData.header_title || 'Rental Agreement'}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Agreement Document Title */}
        <View style={styles.docHeader}>
          <FileText size={28} color={colors.primary} />
          <Text style={styles.docTitle}>{agreementData.doc_title || 'EV SCOOTER RENTAL AGREEMENT'}</Text>
          <Text style={styles.docSubtitle}>{agreementData.doc_subtitle || 'EVSMITH Mobility Services (Hyderabad)'}</Text>
          <Text style={styles.docVersion}>Agreement Ref: #{booking.booking_number} • {agreementData.doc_version || 'v1.0-TS-2026'}</Text>
        </View>

        {/* PARTIES */}
        <View style={styles.partyCard}>
          <Text style={styles.partyTitle}>{agreementData.lessor_section_title || '1. LESSOR / OWNER'}</Text>
          <Text style={styles.partyText}>Business Name: {agreementData.lessor_business_name || 'EVSmith Mobility Services'}</Text>
          <Text style={styles.partyText}>
            Registered Hub: {agreementData.lessor_registered_hub || 'HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081'}
          </Text>
        </View>

        <View style={styles.partyCard}>
          <Text style={styles.partyTitle}>{agreementData.lessee_section_title || '2. LESSEE / RIDER'}</Text>
          <EVInput
            label={agreementData.label_legal_name || 'Full Legal Name'}
            value={lesseeName}
            onChangeText={setLesseeName}
          />
          <EVInput
            label={agreementData.label_contact_phone || 'Contact Mobile'}
            value={lesseePhone}
            onChangeText={setLesseePhone}
            keyboardType="phone-pad"
          />
          <EVDatePicker
            label={agreementData.label_dob || 'Date of Birth (DOB)'}
            value={lesseeDob}
            onChange={setLesseeDob}
            placeholder="Select Date of Birth"
            required
          />
          <EVInput
            label={agreementData.label_address || 'Current Address'}
            value={lesseeAddress}
            onChangeText={setLesseeAddress}
            placeholder="Enter complete current residential address"
            multiline
            required
          />
        </View>

        {/* CLAUSES (ALL FULLY DYNAMIC FROM CMS) */}
        <Text style={styles.sectionHeader}>{agreementData.terms_section_title || 'Terms & Statutory Conditions'}</Text>
        <View style={styles.termsContainer}>
          {activeClauses.map((item: any, idx: number) => (
            <View key={item.id || idx} style={styles.clauseItem}>
              <Text style={styles.clauseTitle}>{item.title}</Text>
              <Text style={styles.clauseText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* DISCLAIMER */}
        <View style={styles.disclaimerCard}>
          <ShieldAlert size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <Text style={styles.disclaimerTitle}>{agreementData.disclaimer_title || 'LEGAL DISCLAIMER'}</Text>
            <Text style={styles.disclaimerText}>
              {agreementData.disclaimer_text || 'This document is a standard rental agreement template. Both parties may seek independent legal counsel to ensure compliance with Telangana Motor Vehicle Regulations.'}
            </Text>
          </View>
        </View>

        {/* DIGITAL SIGNATURE PAD */}
        <Text style={styles.sectionHeader}>{agreementData.signature_section_title || 'Lessee Digital Signature'}</Text>
        <SignaturePad
          onSave={(data) => {
            setSignatureData(data);
            Alert.alert('Signature Captured', 'Your digital signature has been recorded.');
          }}
        />

        {signatureData ? (
          <View style={styles.signedBadge}>
            <Check size={16} color={colors.primary} />
            <Text style={styles.signedBadgeText}>Digital Signature Attached & Verified</Text>
          </View>
        ) : null}

        {/* AGREEMENT CHECKBOX */}
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setTermsAgreed(!termsAgreed)}
          activeOpacity={0.8}
        >
          <View
            style={[
              styles.checkbox,
              termsAgreed && styles.checkboxChecked,
            ]}
          >
            {termsAgreed && (
              <CheckCircle2 size={16} color="#080C0E" strokeWidth={3} />
            )}
          </View>
          <Text style={styles.checkboxText}>
            {agreementData.checkbox_text || 'I have read, understood, and agree to all terms and conditions of this EVSMITH EV Scooter Rental Agreement.'}
          </Text>
        </TouchableOpacity>

        <EVButton
          title={agreementData.submit_button_text || 'Submit & Lock Agreement'}
          onPress={handleSubmitAgreement}
          loading={submitting}
          disabled={!signatureData || !termsAgreed}
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
  docHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  docTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
  },
  docSubtitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  docVersion: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 6,
  },
  partyCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  partyTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: spacing.xs,
    letterSpacing: 0.5,
  },
  partyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  termsContainer: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: spacing.md,
  },
  clauseItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
    paddingBottom: spacing.sm,
  },
  clauseTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  clauseText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 176, 32, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 176, 32, 0.25)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginVertical: spacing.lg,
    gap: spacing.sm,
  },
  disclaimerTitle: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 2,
  },
  disclaimerText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  signedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  signedBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginVertical: spacing.md,
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
  checkboxText: {
    color: colors.textPrimary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  submitBtn: {
    marginBottom: spacing.xxl,
  },
});
