import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  MapPin,
  FileText,
  ShieldCheck,
  ShieldAlert,
  LogOut,
  Edit3,
  CheckCircle2,
  Briefcase,
  AlertCircle,
  X,
  MessageSquare,
  Clock,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { EVDatePicker } from '../../components/common/EVDatePicker';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { useAppContentStore, DEFAULT_PAGE_CONTENT } from '../../store/useAppContentStore';
import { RiderProfile } from '../../types';

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const profile = useAuthStore((state) => state.profile);
  const setProfile = useAuthStore((state) => state.setProfile);
  const updateUser = useAuthStore((state) => state.updateUser);

  const [loading, setLoading] = useState(false);
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const supportPage = useAppContentStore((state) => state.pages['support']) || DEFAULT_PAGE_CONTENT.support;
  const supportData = supportPage.content_data || DEFAULT_PAGE_CONTENT.support.content_data || {};

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState(user?.full_name || profile?.full_name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || profile?.phone || '');
  const [editEmail, setEditEmail] = useState(user?.email || profile?.email || '');
  const [editDob, setEditDob] = useState(profile?.dob || '');
  const [editOccupation, setEditOccupation] = useState(profile?.occupation || '');
  const [editAddress, setEditAddress] = useState(
    profile?.addresses?.[0]?.line ? `${profile.addresses[0].line}, ${profile.addresses[0].city}` : ''
  );
  const [saving, setSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const fetchProfile = async () => {
    if (isSuperAdmin) return;
    try {
      setLoading(true);
      const res = await apiClient.get('/rider/profile');
      if (res.data) {
        setProfile(res.data);
      }
    } catch (err) {
      console.log('Error loading rider profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const executeLogout = () => {
    setShowLogoutModal(false);
    logout();
    const rootNav = navigation.getParent() || navigation;
    try {
      rootNav.reset({
        index: 0,
        routes: [{ name: 'Welcome' }],
      });
    } catch (e) {
      try {
        rootNav.navigate('Welcome');
      } catch {
        navigation.navigate('Welcome');
      }
    }
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      updateUser({
        full_name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim(),
      });
      if (profile) {
        setProfile({
          ...profile,
          full_name: editName.trim(),
          phone: editPhone.trim(),
          email: editEmail.trim(),
          dob: editDob.trim(),
          occupation: editOccupation.trim(),
        });
      }
      setShowEditModal(false);
      Alert.alert('Profile Updated', 'Your profile details have been saved successfully.');
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    user?.full_name ||
    profile?.full_name ||
    (isSuperAdmin ? 'Super Administrator' : 'EVSMITH Rider');

  const displayEmail = user?.email || (isSuperAdmin ? 'admin@evsmith.com' : 'rider@evsmith.com');
  const displayPhone = user?.phone || (isSuperAdmin ? '9876543210' : '9123456780');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Hero Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatarBox}>
            <Text style={styles.avatarInitials}>
              {displayName.slice(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{displayEmail}</Text>

          <View style={styles.roleBadgeRow}>
            {isSuperAdmin ? (
              <View style={styles.adminRoleBadge}>
                <ShieldCheck size={14} color={colors.secondary} />
                <Text style={styles.adminRoleText}>SUPER ADMIN • SUPREME ACCESS</Text>
              </View>
            ) : (
              <View
                style={[
                  styles.riderRoleBadge,
                  profile?.is_profile_complete && styles.riderRoleVerified,
                ]}
              >
                <CheckCircle2
                  size={14}
                  color={profile?.is_profile_complete ? colors.primary : colors.warning}
                />
                <Text
                  style={[
                    styles.riderRoleText,
                    profile?.is_profile_complete && styles.riderRoleTextVerified,
                  ]}
                >
                  {profile?.is_profile_complete ? 'VERIFIED RIDER' : 'KYC UNDER REVIEW'}
                </Text>
              </View>
            )}
          </View>

          {/* Quick Edit Button */}
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => {
              setEditName(displayName);
              setEditPhone(displayPhone);
              setEditEmail(displayEmail);
              setShowEditModal(true);
            }}
            activeOpacity={0.7}
          >
            <Edit3 size={15} color={colors.primary} />
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* DETAILS SECTION */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Contact & Identity Info</Text>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Mail size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{displayEmail}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Phone size={16} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Mobile Phone</Text>
              <Text style={styles.detailValue}>{displayPhone}</Text>
            </View>
          </View>

          {!isSuperAdmin && profile?.dob ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Calendar size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>{profile.dob}</Text>
              </View>
            </View>
          ) : null}

          {!isSuperAdmin && profile?.occupation ? (
            <View style={styles.detailRow}>
              <View style={styles.detailIconBox}>
                <Briefcase size={16} color={colors.primary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Occupation</Text>
                <Text style={styles.detailValue}>{profile.occupation}</Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* ADDRESSES SECTION FOR RIDERS */}
        {!isSuperAdmin && profile?.addresses && profile.addresses.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Registered Addresses</Text>
            {profile.addresses.map((addr, i) => (
              <View key={i} style={styles.detailRow}>
                <View style={styles.detailIconBox}>
                  <MapPin size={16} color={colors.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>
                    {addr.address_type === 'CURRENT' ? 'Current Address' : 'Permanent Address'}
                  </Text>
                  <Text style={styles.detailValue}>
                    {addr.line}, {addr.city}, {addr.state} - {addr.pincode}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* KYC DOCUMENTS SECTION */}
        {!isSuperAdmin && profile?.documents && profile.documents.length > 0 ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>KYC & Verification Documents</Text>
            {profile.documents.map((doc) => (
              <View key={doc.id} style={styles.docItem}>
                <View style={styles.docLeft}>
                  <FileText size={18} color={colors.primary} />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.docType}>{doc.document_type}</Text>
                    <Text style={styles.docNumber}>{doc.document_number}</Text>
                  </View>
                </View>
                <View
                  style={[
                    styles.docStatusBadge,
                    doc.verification_status === 'VERIFIED' && styles.docStatusVerified,
                  ]}
                >
                  <Text
                    style={[
                      styles.docStatusText,
                      doc.verification_status === 'VERIFIED' && styles.docStatusTextVerified,
                    ]}
                  >
                    {doc.verification_status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        {/* SUPER ADMIN PRIVILEGES CARD */}
        {isSuperAdmin && (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Administrator Privileges</Text>
            <View style={styles.privilegeItem}>
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={styles.privilegeText}>Full KYC verification & document review powers</Text>
            </View>
            <View style={styles.privilegeItem}>
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={styles.privilegeText}>Fleet management: add, edit, and update all vehicle cards</Text>
            </View>
            <View style={styles.privilegeItem}>
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={styles.privilegeText}>App Content & CMS: live text & image updates on all pages</Text>
            </View>
            <View style={styles.privilegeItem}>
              <CheckCircle2 size={16} color={colors.primary} />
              <Text style={styles.privilegeText}>Rental booking approval, extension & return supervision</Text>
            </View>
          </View>
        )}

        {/* 24/7 HELPDESK & RIDER SUPPORT (DYNAMIC CMS) */}
        <View style={styles.sectionCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.supportIconBadge}>
                <Phone size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sectionTitle}>{supportPage.title || 'Help & 24/7 Support'}</Text>
                <Text style={styles.supportSubText}>{supportPage.subtitle || 'Roadside assistance & rider care'}</Text>
              </View>
            </View>
          </View>

          {/* Roadside Assistance Hotline */}
          {supportData.roadside_assistance ? (
            <TouchableOpacity
              style={styles.emergencySupportCard}
              onPress={() => Linking.openURL(`tel:${supportData.roadside_assistance.replace(/\s+/g, '')}`)}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={styles.emergencyIconBox}>
                  <ShieldCheck size={18} color="#080C0E" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.emergencyTitle}>24/7 Roadside Rescue Squad</Text>
                  <Text style={styles.emergencySub}>Toll Free: {supportData.roadside_assistance}</Text>
                </View>
              </View>
              <View style={styles.callNowBtn}>
                <Text style={styles.callNowText}>Call 24/7</Text>
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Helpline Phone */}
          {supportData.support_phone ? (
            <TouchableOpacity
              style={styles.supportChannelRow}
              onPress={() => Linking.openURL(`tel:${supportData.support_phone.replace(/\s+/g, '')}`)}
              activeOpacity={0.7}
            >
              <View style={styles.channelIconBox}>
                <Phone size={15} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.channelLabel}>Customer Care Helpline</Text>
                <Text style={styles.channelValue}>{supportData.support_phone}</Text>
              </View>
              <Text style={styles.channelActionText}>Dial</Text>
            </TouchableOpacity>
          ) : null}

          {/* WhatsApp Support */}
          {supportData.whatsapp_number ? (
            <TouchableOpacity
              style={styles.supportChannelRow}
              onPress={() => {
                const cleanPhone = supportData.whatsapp_number.replace(/[^0-9]/g, '');
                Linking.openURL(`https://wa.me/${cleanPhone}?text=Hello%20EVSMITH%20Support`);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.channelIconBox, { backgroundColor: 'rgba(37, 211, 102, 0.15)' }]}>
                <MessageSquare size={15} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.channelLabel}>WhatsApp Instant Chat</Text>
                <Text style={styles.channelValue}>{supportData.whatsapp_number}</Text>
              </View>
              <Text style={[styles.channelActionText, { color: '#25D366' }]}>Chat</Text>
            </TouchableOpacity>
          ) : null}

          {/* Email Support */}
          {supportData.support_email ? (
            <TouchableOpacity
              style={styles.supportChannelRow}
              onPress={() => Linking.openURL(`mailto:${supportData.support_email}?subject=EVSmith%20Rider%20Inquiry`)}
              activeOpacity={0.7}
            >
              <View style={styles.channelIconBox}>
                <Mail size={15} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.channelLabel}>Official Email Support</Text>
                <Text style={styles.channelValue}>{supportData.support_email}</Text>
              </View>
              <Text style={styles.channelActionText}>Email</Text>
            </TouchableOpacity>
          ) : null}

          {/* Hub Address & Timings */}
          <View style={styles.supportMetaBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={styles.supportMetaText}>Hours: {supportData.operating_hours || '24/7 (Mon - Sun)'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 }}>
              <MapPin size={13} color={colors.textMuted} style={{ marginTop: 2 }} />
              <Text style={[styles.supportMetaText, { flex: 1 }]}>{supportData.hub_address || 'HITEC City Main Hub, Cyber Towers, Hyderabad'}</Text>
            </View>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <LogOut size={18} color="#FF4D4D" />
            <Text style={styles.logoutBtnText}>Log Out of Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* EDIT PROFILE MODAL */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile Information</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowEditModal(false)}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%', maxHeight: 420 }}>
              <EVInput
                label="Full Name"
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter full name"
              />

              <EVInput
                label="Mobile Phone"
                value={editPhone}
                onChangeText={setEditPhone}
                keyboardType="phone-pad"
                placeholder="10-digit mobile"
              />

              <EVInput
                label="Email Address"
                value={editEmail}
                onChangeText={setEditEmail}
                keyboardType="email-address"
                placeholder="your.email@example.com"
              />

              {!isSuperAdmin && (
                <>
                  <EVDatePicker
                    label="Date of Birth"
                    value={editDob}
                    onChange={setEditDob}
                    placeholder="Select DOB"
                  />

                  <EVInput
                    label="Occupation"
                    value={editOccupation}
                    onChangeText={setEditOccupation}
                    placeholder="e.g. Delivery Partner / Student / Professional"
                  />
                </>
              )}

              <View style={styles.modalBtnRow}>
                <EVButton
                  title="Cancel"
                  onPress={() => setShowEditModal(false)}
                  variant="ghost"
                  size="sm"
                  style={{ flex: 1 }}
                />
                <EVButton
                  title="Save Changes"
                  onPress={handleSaveProfile}
                  loading={saving}
                  variant="primary"
                  size="sm"
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* LOGOUT CONFIRMATION MODAL */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360, alignItems: 'center' }]}>
            <View style={styles.logoutIconBadge}>
              <LogOut size={28} color="#FF4D4D" />
            </View>
            <Text style={[styles.modalTitle, { textAlign: 'center', marginTop: spacing.sm }]}>
              Log Out of Account?
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: 13,
                textAlign: 'center',
                marginTop: 6,
                marginBottom: spacing.lg,
                lineHeight: 18,
              }}
            >
              Are you sure you want to log out of your EVSMITH account on this device?
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <EVButton
                title="Cancel"
                variant="ghost"
                size="sm"
                onPress={() => setShowLogoutModal(false)}
                style={{ flex: 1 }}
              />
              <EVButton
                title="Yes, Log Out"
                variant="danger"
                size="sm"
                onPress={executeLogout}
                style={{ flex: 1.2, backgroundColor: '#FF4D4D' }}
              />
            </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarInitials: {
    color: colors.primary,
    fontSize: 26,
    fontWeight: '800',
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  profileEmail: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  roleBadgeRow: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  adminRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 212, 255, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.secondary,
    gap: 6,
  },
  adminRoleText: {
    color: colors.secondary,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  riderRoleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 176, 32, 0.1)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.warning,
    gap: 6,
  },
  riderRoleVerified: {
    backgroundColor: 'rgba(0, 229, 153, 0.1)',
    borderColor: colors.primary,
  },
  riderRoleText: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  riderRoleTextVerified: {
    color: colors.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  editBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  docLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docType: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  docNumber: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
  docStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 176, 32, 0.15)',
  },
  docStatusVerified: {
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
  },
  docStatusText: {
    color: colors.warning,
    fontSize: 10,
    fontWeight: '800',
  },
  docStatusTextVerified: {
    color: colors.primary,
  },
  privilegeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: spacing.sm + 2,
  },
  privilegeText: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  logoutContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: '#FF4D4D',
    paddingVertical: 14,
    borderRadius: borderRadius.md,
  },
  logoutBtnText: {
    color: '#FF4D4D',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  logoutIconBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 77, 77, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  supportIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supportSubText: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  emergencySupportCard: {
    backgroundColor: '#0F1E19',
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 153, 0.4)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  emergencyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  emergencySub: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  callNowBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  callNowText: {
    color: '#080C0E',
    fontSize: 11,
    fontWeight: '800',
  },
  supportChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    padding: 10,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
    gap: 10,
  },
  channelIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  channelValue: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  channelActionText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
  },
  supportMetaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    marginTop: 4,
  },
  supportMetaText: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});
