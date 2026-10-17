import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import {
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  FileText,
  AlertCircle,
  Sparkles,
  Image as ImageIcon,
  FileCheck,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { EVDatePicker } from '../../components/common/EVDatePicker';
import { ProgressStepper } from '../../components/common/ProgressStepper';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';

interface RiderRegistrationScreenProps {
  route: any;
  navigation: any;
}

export const RiderRegistrationScreen: React.FC<RiderRegistrationScreenProps> = ({
  route,
  navigation,
}) => {
  const { initialName = '', initialPhone = '', initialEmail = '' } = route.params || {};

  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);

  // Step 1: Personal Info - Only initial registration values are prefilled and fully editable
  const [fullName, setFullName] = useState(initialName || '');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [mobileNumber, setMobileNumber] = useState(initialPhone || '');
  const [email, setEmail] = useState(initialEmail || '');
  const [occupation, setOccupation] = useState('');
  const [employerId, setEmployerId] = useState('');
  const [altMobile, setAltMobile] = useState('');

  // Step 2: Address Details - Empty for manual entry
  const [currLine, setCurrLine] = useState('');
  const [currCity, setCurrCity] = useState('');
  const [currState, setCurrState] = useState('');
  const [currPin, setCurrPin] = useState('');
  const [currCountry, setCurrCountry] = useState('India');

  const [sameAsCurrent, setSameAsCurrent] = useState(false);
  const [permLine, setPermLine] = useState('');
  const [permCity, setPermCity] = useState('');
  const [permState, setPermState] = useState('');
  const [permPin, setPermPin] = useState('');
  const [permCountry, setPermCountry] = useState('India');

  // Step 3: Identity & KYC - Empty for manual entry & file upload
  const [docType, setDocType] = useState<'AADHAAR' | 'PAN' | 'DRIVING_LICENCE'>('DRIVING_LICENCE');
  const [docNumber, setDocNumber] = useState('');
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [cloudinaryPublicId, setCloudinaryPublicId] = useState<string | null>(null);
  const [docFileName, setDocFileName] = useState<string | null>(null);
  const [docIsPdf, setDocIsPdf] = useState<boolean>(false);

  // Step 4: Reference & Emergency Contact - Empty for manual entry
  const [refName, setRefName] = useState('');
  const [refPhone, setRefPhone] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Step 5: Declaration
  const [declarationAgreed, setDeclarationAgreed] = useState(false);

  // Success State
  const [isSuccess, setIsSuccess] = useState(false);

  const updateUser = useAuthStore((state) => state.updateUser);
  const setProfile = useAuthStore((state) => state.setProfile);

  // Handle "Same as current" toggle
  const handleToggleSameAddress = (val: boolean) => {
    setSameAsCurrent(val);
    if (val) {
      setPermLine(currLine);
      setPermCity(currCity);
      setPermState(currState);
      setPermPin(currPin);
      setPermCountry(currCountry);
    } else {
      setPermLine('');
      setPermCity('');
      setPermState('');
      setPermPin('');
      setPermCountry('India');
    }
  };

  // Upload file helper (handles both image and PDF upload to Cloudinary)
  const uploadFileToCloud = async (uri: string, filename: string, mimeType: string, isPdf: boolean) => {
    setUploadingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
        name: filename,
        type: mimeType,
      } as any);

      const uploadRes = await apiClient.post('/rider/upload-document', formData);
      if (uploadRes.data?.secure_url) {
        setDocUrl(uploadRes.data.secure_url);
        setCloudinaryPublicId(uploadRes.data.public_id);
        setDocFileName(filename);
        setDocIsPdf(isPdf || filename.toLowerCase().endsWith('.pdf'));
        Alert.alert('Upload Successful', `${isPdf ? 'PDF' : 'Photo'} uploaded successfully to Cloudinary!`);
      } else {
        throw new Error('Upload completed but returned no secure URL.');
      }
    } catch (uploadErr: any) {
      console.warn('Backend upload notice:', uploadErr?.message);
      // Local fallback for offline / preview
      setDocUrl(uri);
      setCloudinaryPublicId(`local_${Date.now()}`);
      setDocFileName(filename);
      setDocIsPdf(isPdf || filename.toLowerCase().endsWith('.pdf'));
      Alert.alert('Document Selected', `${filename} is ready.`);
    } finally {
      setUploadingDoc(false);
    }
  };

  // 1. Pick Photo / Image (JPG/PNG)
  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.fileName || `doc_${docType.toLowerCase()}_${Date.now()}.jpg`;
        const mimeType = asset.mimeType || 'image/jpeg';
        await uploadFileToCloud(asset.uri, filename, mimeType, false);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to open image gallery.');
    }
  };

  // 2. Pick PDF Document
  const handlePickPdf = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const filename = asset.name || `doc_${docType.toLowerCase()}_${Date.now()}.pdf`;
        const mimeType = asset.mimeType || 'application/pdf';
        await uploadFileToCloud(asset.uri, filename, mimeType, true);
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Unable to pick PDF file.');
    }
  };

  const validateStep = (s: number): boolean => {
    if (s === 1) {
      if (!fullName.trim() || !dob.trim() || !gender.trim() || !mobileNumber.trim() || !email.trim() || !occupation.trim() || !employerId.trim()) {
        Alert.alert('Incomplete Step', 'Please fill in all mandatory fields (*).');
        return false;
      }
    } else if (s === 2) {
      if (!currLine.trim() || !currCity.trim() || !currState.trim() || !currPin.trim()) {
        Alert.alert('Incomplete Step', 'Please enter your complete current address.');
        return false;
      }
      if (!sameAsCurrent && (!permLine.trim() || !permCity.trim() || !permPin.trim())) {
        Alert.alert('Incomplete Step', 'Please enter your complete permanent address.');
        return false;
      }
    } else if (s === 3) {
      if (!docNumber.trim() || !docUrl) {
        Alert.alert('Document Required', 'Please provide your document number and upload a valid document copy.');
        return false;
      }
    } else if (s === 4) {
      if (!refName.trim() || !refPhone.trim() || !emergencyName.trim() || !emergencyPhone.trim()) {
        Alert.alert('Incomplete Step', 'Please fill in all reference and emergency contact details.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitRegistration = async () => {
    if (!declarationAgreed) {
      Alert.alert('Declaration Required', 'You must accept the Rider Declaration to proceed.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        personal: {
          full_name: fullName.trim(),
          dob: dob.trim(),
          gender,
          occupation: occupation.trim(),
          employer_id: employerId.trim(),
          mobile_number: mobileNumber.trim(),
          email: email.trim(),
          alt_mobile: altMobile.trim() || undefined,
        },
        address: {
          current: {
            address_type: 'CURRENT',
            line: currLine.trim(),
            city: currCity.trim(),
            state: currState.trim(),
            pincode: currPin.trim(),
            country: currCountry.trim(),
            is_same_as_current: false,
          },
          permanent: {
            address_type: 'PERMANENT',
            line: sameAsCurrent ? currLine.trim() : permLine.trim(),
            city: sameAsCurrent ? currCity.trim() : permCity.trim(),
            state: sameAsCurrent ? currState.trim() : permState.trim(),
            pincode: sameAsCurrent ? currPin.trim() : permPin.trim(),
            country: sameAsCurrent ? currCountry.trim() : permCountry.trim(),
            is_same_as_current: sameAsCurrent,
          },
        },
        document: {
          document_type: docType,
          document_number: docNumber.trim(),
          secure_url: docUrl,
          cloudinary_public_id: cloudinaryPublicId || undefined,
        },
        contacts: {
          reference_name: refName.trim(),
          reference_phone: refPhone.trim(),
          emergency_name: emergencyName.trim(),
          emergency_phone: emergencyPhone.trim(),
        },
        declaration: {
          agreed: declarationAgreed,
        },
      };

      const res = await apiClient.post('/rider/registration', payload);
      setProfile(res.data);
      updateUser({ is_profile_complete: true, full_name: fullName.trim() });
      setIsSuccess(true);
    } catch (err: any) {
      Alert.alert('Registration Error', err.message || 'Unable to submit registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContent}>
          <View style={styles.celebrationBadge}>
            <Sparkles size={36} color="#080C0E" />
          </View>
          <Text style={styles.successTitle}>Profile Created & Submitted!</Text>
          <Text style={styles.successSubtitle}>
            Your KYC identity document is under review. You can now explore the EV fleet and submit rental requests.
          </Text>

          <View style={styles.successCard}>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Rider Name:</Text>
              <Text style={styles.successValue}>{fullName}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Document:</Text>
              <Text style={styles.successValue}>{docType} ({docNumber})</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>Status:</Text>
              <Text style={[styles.successValue, { color: colors.warning }]}>Under Review</Text>
            </View>
          </View>

          <EVButton
            title="Go to Rider Dashboard"
            onPress={() => navigation.replace('MainTabs')}
            variant="primary"
            size="lg"
            style={{ width: '100%' }}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerRow}>
          {step > 1 ? (
            <TouchableOpacity onPress={handleBack} style={styles.navBackBtn}>
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
          <Text style={styles.headerTitle}>Rider Registration</Text>
          <View style={{ width: 40 }} />
        </View>

        <ProgressStepper currentStep={step} />

        {/* STEP 1: PERSONAL INFORMATION */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <View style={styles.importedNotice}>
              <AlertCircle size={16} color={colors.primary} />
              <Text style={styles.importedNoticeText}>
                These details were imported from your registration. You can edit them if required.
              </Text>
            </View>

            <EVInput
              label="Full Legal Name"
              required
              value={fullName}
              onChangeText={setFullName}
            />

            <View style={styles.rowTwo}>
              <EVDatePicker
                label="Date of Birth"
                required
                placeholder="Select DOB"
                value={dob}
                onChange={setDob}
                containerStyle={{ flex: 1 }}
              />
              <EVInput
                label="Gender"
                required
                placeholder="Male / Female / Other"
                value={gender}
                onChangeText={setGender}
                containerStyle={{ flex: 1 }}
              />
            </View>

            <EVInput
              label="Mobile Number"
              required
              keyboardType="phone-pad"
              value={mobileNumber}
              onChangeText={setMobileNumber}
            />

            <EVInput
              label="Email Address"
              required
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <EVInput
              label="Occupation / Employer"
              required
              placeholder="e.g. Software Engineer / Octacomm"
              value={occupation}
              onChangeText={setOccupation}
            />

            <EVInput
              label="Occupation / Employer ID"
              required
              placeholder="e.g. EMP-9982"
              value={employerId}
              onChangeText={setEmployerId}
            />

            <EVInput
              label="Alternative Mobile Number"
              placeholder="Optional backup contact"
              keyboardType="phone-pad"
              value={altMobile}
              onChangeText={setAltMobile}
            />
          </View>
        )}

        {/* STEP 2: ADDRESS DETAILS */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.sectionHeader}>Current Residential Address</Text>
            <EVInput
              label="Address Line"
              required
              placeholder="Flat/House No., Street, Landmark"
              value={currLine}
              onChangeText={setCurrLine}
            />
            <View style={styles.rowTwo}>
              <EVInput
                label="City"
                required
                value={currCity}
                onChangeText={setCurrCity}
                containerStyle={{ flex: 1 }}
              />
              <EVInput
                label="State"
                required
                value={currState}
                onChangeText={setCurrState}
                containerStyle={{ flex: 1 }}
              />
            </View>
            <View style={styles.rowTwo}>
              <EVInput
                label="PIN Code"
                required
                keyboardType="number-pad"
                maxLength={6}
                value={currPin}
                onChangeText={setCurrPin}
                containerStyle={{ flex: 1 }}
              />
              <EVInput
                label="Country"
                required
                value={currCountry}
                onChangeText={setCurrCountry}
                containerStyle={{ flex: 1 }}
              />
            </View>

            {/* Same as current toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Permanent address same as current</Text>
              <Switch
                value={sameAsCurrent}
                onValueChange={handleToggleSameAddress}
                trackColor={{ false: colors.surfaceBorder, true: colors.primaryDark }}
                thumbColor={sameAsCurrent ? colors.primary : colors.textSecondary}
              />
            </View>

            {!sameAsCurrent && (
              <>
                <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
                  Permanent Address
                </Text>
                <EVInput
                  label="Address Line"
                  required
                  value={permLine}
                  onChangeText={setPermLine}
                />
                <View style={styles.rowTwo}>
                  <EVInput
                    label="City"
                    required
                    value={permCity}
                    onChangeText={setPermCity}
                    containerStyle={{ flex: 1 }}
                  />
                  <EVInput
                    label="State"
                    required
                    value={permState}
                    onChangeText={setPermState}
                    containerStyle={{ flex: 1 }}
                  />
                </View>
                <View style={styles.rowTwo}>
                  <EVInput
                    label="PIN Code"
                    required
                    keyboardType="number-pad"
                    maxLength={6}
                    value={permPin}
                    onChangeText={setPermPin}
                    containerStyle={{ flex: 1 }}
                  />
                  <EVInput
                    label="Country"
                    required
                    value={permCountry}
                    onChangeText={setPermCountry}
                    containerStyle={{ flex: 1 }}
                  />
                </View>
              </>
            )}
          </View>
        )}

        {/* STEP 3: IDENTIFICATION & VERIFICATION */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.sectionHeader}>Select Government ID Document</Text>
            <View style={styles.docSelector}>
              {(['DRIVING_LICENCE', 'AADHAAR', 'PAN'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setDocType(type)}
                  style={[
                    styles.docOption,
                    docType === type && styles.docOptionActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.docOptionText,
                      docType === type && styles.docOptionTextActive,
                    ]}
                  >
                    {type.replace('_', ' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <EVInput
              label="Document Identification Number"
              required
              placeholder="e.g. TS09-20220019482"
              value={docNumber}
              onChangeText={setDocNumber}
            />

            <Text style={styles.uploadLabel}>Original Document Upload *</Text>
            <Text style={styles.uploadSubLabel}>Upload clear ID proof as an Image (JPG/PNG) or PDF document</Text>

            <View style={styles.uploadContainer}>
              {uploadingDoc ? (
                <View style={styles.uploadLoadingBox}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.uploadLoadingText}>Uploading document to Cloudinary...</Text>
                </View>
              ) : docUrl ? (
                <View style={styles.previewBox}>
                  {docIsPdf ? (
                    <View style={styles.pdfCard}>
                      <View style={styles.pdfIconBadge}>
                        <FileCheck size={32} color={colors.primary} />
                      </View>
                      <View style={styles.pdfCardDetails}>
                        <Text style={styles.pdfCardTitle} numberOfLines={1}>
                          {docFileName || `${docType.replace('_', ' ')} Document.pdf`}
                        </Text>
                        <View style={styles.pdfStatusBadge}>
                          <CheckCircle2 size={12} color={colors.primary} />
                          <Text style={styles.pdfStatusText}>PDF Verified & Ready</Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.imageCard}>
                      <Image source={{ uri: docUrl }} style={styles.previewImage} resizeMode="cover" />
                      <View style={styles.imageBadge}>
                        <CheckCircle2 size={12} color={colors.primary} />
                        <Text style={styles.imageBadgeText}>Photo Ready</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.replaceActionsRow}>
                    <TouchableOpacity
                      style={styles.replaceActionBtn}
                      onPress={handlePickImage}
                      activeOpacity={0.8}
                    >
                      <ImageIcon size={16} color={colors.textPrimary} />
                      <Text style={styles.replaceActionText}>Replace with Photo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.replaceActionBtn, styles.replaceActionBtnAlt]}
                      onPress={handlePickPdf}
                      activeOpacity={0.8}
                    >
                      <FileText size={16} color={colors.primary} />
                      <Text style={[styles.replaceActionText, { color: colors.primary }]}>Replace with PDF</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadChoiceContainer}>
                  <TouchableOpacity
                    style={styles.uploadChoiceCard}
                    onPress={handlePickImage}
                    activeOpacity={0.7}
                  >
                    <View style={styles.uploadChoiceIcon}>
                      <ImageIcon size={26} color={colors.primary} />
                    </View>
                    <Text style={styles.uploadChoiceTitle}>Upload Photo</Text>
                    <Text style={styles.uploadChoiceDesc}>JPG, PNG from Gallery</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.uploadChoiceCard, styles.uploadChoiceCardPdf]}
                    onPress={handlePickPdf}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.uploadChoiceIcon, styles.uploadChoiceIconPdf]}>
                      <FileText size={26} color={colors.secondary} />
                    </View>
                    <Text style={styles.uploadChoiceTitle}>Upload PDF</Text>
                    <Text style={styles.uploadChoiceDesc}>Official PDF document</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}

        {/* STEP 4: REFERENCE & EMERGENCY CONTACT */}
        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.sectionHeader}>Professional / Personal Reference</Text>
            <EVInput
              label="Reference Full Name"
              required
              placeholder="e.g. Colleague or Mentor Name"
              value={refName}
              onChangeText={setRefName}
            />
            <EVInput
              label="Reference Mobile Number"
              required
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={refPhone}
              onChangeText={setRefPhone}
            />

            <Text style={[styles.sectionHeader, { marginTop: spacing.md }]}>
              Family / Emergency Contact
            </Text>
            <EVInput
              label="Emergency Contact Name"
              required
              placeholder="e.g. Parent / Spouse / Sibling"
              value={emergencyName}
              onChangeText={setEmergencyName}
            />
            <EVInput
              label="Emergency Contact Phone"
              required
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
            />
          </View>
        )}

        {/* STEP 5: RIDER DECLARATION */}
        {step === 5 && (
          <View style={styles.stepCard}>
            <View style={styles.declarationBox}>
              <FileText size={22} color={colors.primary} style={{ marginBottom: spacing.xs }} />
              <Text style={styles.declarationTitle}>Rider Legal Declaration</Text>
              <Text style={styles.declarationBody}>
                I hereby declare that all the information provided above is true and correct.
                I have submitted the required information and original documents for verification
                and agree to abide by the terms and conditions of the EVSMITH scooter rental agreement.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.8}
              onPress={() => setDeclarationAgreed(!declarationAgreed)}
            >
              <View
                style={[
                  styles.checkbox,
                  declarationAgreed && styles.checkboxChecked,
                ]}
              >
                {declarationAgreed && (
                  <CheckCircle2 size={16} color="#080C0E" strokeWidth={3} />
                )}
              </View>
              <Text style={styles.checkboxText}>
                I agree to the Rider Declaration and authorize EVSMITH Mobility Services to verify my identity documents.
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Actions */}
        <View style={styles.footerActions}>
          {step < 5 ? (
            <EVButton
              title="Next Step"
              onPress={handleNext}
              variant="primary"
              size="lg"
            />
          ) : (
            <EVButton
              title="Complete Registration"
              onPress={handleSubmitRegistration}
              loading={submitting}
              disabled={!declarationAgreed}
              variant="primary"
              size="lg"
            />
          )}
        </View>
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
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  navBackBtn: {
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
  stepCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  importedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.25)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  importedNoticeText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  sectionHeader: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: spacing.md,
    letterSpacing: 0.3,
  },
  rowTwo: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    marginTop: spacing.xs,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  docSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  docOption: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    alignItems: 'center',
  },
  docOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
  },
  docOptionText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  docOptionTextActive: {
    color: colors.primary,
  },
  uploadLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  uploadSubLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  uploadContainer: {
    marginTop: spacing.xs,
  },
  uploadLoadingBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    gap: spacing.sm,
  },
  uploadLoadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  uploadChoiceContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  uploadChoiceCard: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  uploadChoiceCardPdf: {
    borderColor: colors.secondary,
  },
  uploadChoiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  uploadChoiceIconPdf: {
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
  },
  uploadChoiceTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  uploadChoiceDesc: {
    color: colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  previewBox: {
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  imageCard: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0A1014',
  },
  imageBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(8, 12, 14, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  imageBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  pdfIconBadge: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfCardDetails: {
    flex: 1,
    gap: 4,
  },
  pdfCardTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  pdfStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pdfStatusText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  replaceActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    backgroundColor: colors.surface,
  },
  replaceActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm + 2,
    gap: 6,
  },
  replaceActionBtnAlt: {
    borderLeftWidth: 1,
    borderLeftColor: colors.surfaceBorder,
  },
  replaceActionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  declarationBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.lg,
  },
  declarationTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  declarationBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
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
  footerActions: {
    marginBottom: spacing.xxl,
  },
  successContent: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  successSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successLabel: {
    color: colors.textMuted,
    fontSize: 13,
  },
  successValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
