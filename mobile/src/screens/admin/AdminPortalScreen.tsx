import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Zap,
  Plus,
  Edit3,
  Sliders,
  User,
  ExternalLink,
  Info,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Save,
  Sparkles,
  X,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  AlertTriangle,
  Eye,
  Link2,
  RotateCcw,
  Check,
  Cpu,
  MessageSquare,
  HelpCircle,
} from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../../theme';
import { EVButton } from '../../components/common/EVButton';
import { EVInput } from '../../components/common/EVInput';
import { StatusBadge } from '../../components/common/StatusBadge';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { useAppContentStore, DEFAULT_PAGE_CONTENT, DEFAULT_AGREEMENT_TERMS } from '../../store/useAppContentStore';
import { Booking, RiderProfile, Vehicle } from '../../types';

interface AdminPortalScreenProps {
  navigation?: any;
}

export const AdminPortalScreen: React.FC<AdminPortalScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'BOOKINGS' | 'RIDERS' | 'FLEET' | 'CMS'>('BOOKINGS');

  // Data states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [riders, setRiders] = useState<RiderProfile[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Action loading states
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);

  // In-Detail Booking Modal State
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  // Vehicle Edit / Add Modal States
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehMake, setVehMake] = useState('EVSMITH');
  const [vehModel, setVehModel] = useState('S1 Pro');
  const [vehVariant, setVehVariant] = useState('Gen 2 Performance');
  const [vehReg, setVehReg] = useState('TS 09 EV 4102');
  const [vehChassis, setVehChassis] = useState('ME3EVSMITH2026');
  const [vehBattery, setVehBattery] = useState('100');
  const [vehRange, setVehRange] = useState('120');
  const [vehSpeed, setVehSpeed] = useState('85');
  const [vehDailyRate, setVehDailyRate] = useState('299');
  const [vehDeposit, setVehDeposit] = useState('1500');
  const [vehStatus, setVehStatus] = useState<string>('AVAILABLE');
  const [vehImageUrl, setVehImageUrl] = useState('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80');
  const [vehStationId, setVehStationId] = useState<number>(1);
  const [stations, setStations] = useState<any[]>([]);
  const [vehFeatures, setVehFeatures] = useState('');
  const [uploadingVehImage, setUploadingVehImage] = useState(false);
  const [vehImageInputMode, setVehImageInputMode] = useState<'upload' | 'url'>('upload');
  const [fleetHeroInputMode, setFleetHeroInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadingFleetHero, setUploadingFleetHero] = useState(false);
  const [supportHeroInputMode, setSupportHeroInputMode] = useState<'upload' | 'url'>('upload');
  const [uploadingSuppImage, setUploadingSuppImage] = useState(false);
  const [savingVehicle, setSavingVehicle] = useState(false);

  // CMS Content Management State
  const pages = useAppContentStore((state) => state.pages);
  const fetchCMSContent = useAppContentStore((state) => state.fetchContent);
  const updateCMSContent = useAppContentStore((state) => state.updatePageContent);

  const [cmsPageKey, setCmsPageKey] = useState<'welcome' | 'fleet' | 'agreement' | 'support'>('welcome');
  const [cmsBrandLogoUrl, setCmsBrandLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreviewError, setLogoPreviewError] = useState(false);
  const [cmsBrandName, setCmsBrandName] = useState('EVSMITH');
  const [cmsBrandAccent, setCmsBrandAccent] = useState('MOBILITY');
  const [cmsTitle, setCmsTitle] = useState('');
  const [cmsSubtitle, setCmsSubtitle] = useState('');
  const [cmsImageUrl, setCmsImageUrl] = useState('');
  const [cmsCta, setCmsCta] = useState('');
  const [cmsLogin, setCmsLogin] = useState('');
  const [cmsBanner, setCmsBanner] = useState('');
  const [cmsSupportPhone, setCmsSupportPhone] = useState('');
  const [savingCMS, setSavingCMS] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageReloadKey, setImageReloadKey] = useState(0);
  const [logoInputMode, setLogoInputMode] = useState<'upload' | 'url'>('upload');
  const [heroInputMode, setHeroInputMode] = useState<'upload' | 'url'>('upload');

  // Agreement CMS State (Granular Control over every label, word & clause)
  const [agreeHeaderTitle, setAgreeHeaderTitle] = useState('Rental Agreement');
  const [agreeDocTitle, setAgreeDocTitle] = useState('EV SCOOTER RENTAL AGREEMENT');
  const [agreeDocSubtitle, setAgreeDocSubtitle] = useState('EVSMITH Mobility Services (Hyderabad)');
  const [agreeDocVersion, setAgreeDocVersion] = useState('v1.0-TS-2026');
  const [agreeLessorSection, setAgreeLessorSection] = useState('1. LESSOR / OWNER');
  const [agreeLessorBusiness, setAgreeLessorBusiness] = useState('EVSmith Mobility Services');
  const [agreeLessorHub, setAgreeLessorHub] = useState('HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081');
  const [agreeLesseeSection, setAgreeLesseeSection] = useState('2. LESSEE / RIDER');
  const [agreeLabelName, setAgreeLabelName] = useState('Full Legal Name');
  const [agreeLabelPhone, setAgreeLabelPhone] = useState('Contact Mobile');
  const [agreeLabelDob, setAgreeLabelDob] = useState('Date of Birth (DOB)');
  const [agreeLabelAddress, setAgreeLabelAddress] = useState('Current Address');
  const [agreeTermsHeader, setAgreeTermsHeader] = useState('Terms & Statutory Conditions');
  const [agreeClauses, setAgreeClauses] = useState<Array<{ id: number | string; title: string; text: string }>>(DEFAULT_AGREEMENT_TERMS);
  const [agreeDisclaimerTitle, setAgreeDisclaimerTitle] = useState('LEGAL DISCLAIMER');
  const [agreeDisclaimerText, setAgreeDisclaimerText] = useState('This document is a standard rental agreement template. Both parties may seek independent legal counsel to ensure compliance with Telangana Motor Vehicle Regulations.');
  const [agreeSignatureTitle, setAgreeSignatureTitle] = useState('Lessee Digital Signature');
  const [agreeSigPadLabel, setAgreeSigPadLabel] = useState('Digital Signature Pad');
  const [agreeSigPadPlaceholder, setAgreeSigPadPlaceholder] = useState('Sign with your finger inside this box');
  const [agreeCheckboxText, setAgreeCheckboxText] = useState('I have read, understood, and agree to all terms and conditions of this EVSMITH EV Scooter Rental Agreement.');
  const [agreeSubmitBtn, setAgreeSubmitBtn] = useState('Submit & Lock Agreement');

  // Support CMS State
  const [suppTitle, setSuppTitle] = useState('24/7 EVSMITH Helpline & Rider Support');
  const [suppSubtitle, setSuppSubtitle] = useState('Dedicated roadside assistance, battery swap, and rental support in Hyderabad.');
  const [suppImageUrl, setSuppImageUrl] = useState('');
  const [suppEmail, setSuppEmail] = useState('support@evsmith.com');
  const [suppPhone, setSuppPhone] = useState('+91 98765 43210');
  const [suppWhatsapp, setSuppWhatsapp] = useState('+91 98765 43210');
  const [suppRoadside, setSuppRoadside] = useState('1800 200 4567');
  const [suppHours, setSuppHours] = useState('24/7 (Mon - Sun)');
  const [suppAddress, setSuppAddress] = useState('HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081');
  const [suppNotes, setSuppNotes] = useState('In case of breakdown, battery drain, or puncture, our roadside rescue squad arrives within 30 minutes.');

  // Load Admin Token & Data
  const getAdminToken = async () => {
    const adminLogin = await apiClient.post('/auth/login', {
      identifier: 'admin@evsmith.com',
      password: 'Admin@EVSmith2026!',
    });
    return adminLogin.data.access_token;
  };

  const fetchAdminData = async () => {
    try {
      const token = await getAdminToken();

      const [bRes, rRes, vRes, sRes] = await Promise.all([
        apiClient.get('/admin/booking-requests', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get('/admin/riders', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get('/admin/vehicles', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        apiClient.get('/vehicles/stations').catch(() => ({ data: [] })),
      ]);

      setBookings(bRes.data);
      setRiders(rRes.data);
      setVehicles(vRes.data);
      if (sRes.data && Array.isArray(sRes.data)) {
        setStations(sRes.data);
      }
      await fetchCMSContent();
      const freshPages = useAppContentStore.getState().pages;
      syncCMSFormWithData(freshPages[cmsPageKey]);
    } catch (err) {
      console.log('Error fetching admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const syncCMSFormWithData = (targetPage?: any) => {
    const page = targetPage || pages[cmsPageKey] || DEFAULT_PAGE_CONTENT[cmsPageKey];
    if (page) {
      setCmsBrandLogoUrl(page.content_data?.brand_logo_url || '');
      setLogoPreviewError(false);
      setCmsBrandName(page.content_data?.brand_name || 'EVSMITH');
      setCmsBrandAccent(page.content_data?.brand_accent || 'MOBILITY');
      setCmsTitle(page.title || '');
      setCmsSubtitle(page.subtitle || '');
      setCmsImageUrl(page.image_url || '');
      setImagePreviewError(false);
      setImageReloadKey((k) => k + 1);
      setCmsCta(page.content_data?.cta_button || '');
      setCmsLogin(page.content_data?.login_button || '');
      setCmsBanner(page.content_data?.banner_text || '');
      setCmsSupportPhone(page.content_data?.support_phone || '');

      // Sync Agreement Fields
      const agreeDef = DEFAULT_PAGE_CONTENT.agreement?.content_data || {};
      const agreeData = page.content_data || {};
      setAgreeHeaderTitle(agreeData.header_title ?? page.title ?? agreeDef.header_title ?? 'Rental Agreement');
      setAgreeDocTitle(agreeData.doc_title ?? page.subtitle ?? agreeDef.doc_title ?? 'EV SCOOTER RENTAL AGREEMENT');
      setAgreeDocSubtitle(agreeData.doc_subtitle ?? agreeDef.doc_subtitle ?? 'EVSMITH Mobility Services (Hyderabad)');
      setAgreeDocVersion(agreeData.doc_version ?? agreeDef.doc_version ?? 'v1.0-TS-2026');
      setAgreeLessorSection(agreeData.lessor_section_title ?? agreeDef.lessor_section_title ?? '1. LESSOR / OWNER');
      setAgreeLessorBusiness(agreeData.lessor_business_name ?? agreeDef.lessor_business_name ?? 'EVSmith Mobility Services');
      setAgreeLessorHub(agreeData.lessor_registered_hub ?? agreeDef.lessor_registered_hub ?? 'HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081');
      setAgreeLesseeSection(agreeData.lessee_section_title ?? agreeDef.lessee_section_title ?? '2. LESSEE / RIDER');
      setAgreeLabelName(agreeData.label_legal_name ?? agreeDef.label_legal_name ?? 'Full Legal Name');
      setAgreeLabelPhone(agreeData.label_contact_phone ?? agreeDef.label_contact_phone ?? 'Contact Mobile');
      setAgreeLabelDob(agreeData.label_dob ?? agreeDef.label_dob ?? 'Date of Birth (DOB)');
      setAgreeLabelAddress(agreeData.label_address ?? agreeDef.label_address ?? 'Current Address');
      setAgreeTermsHeader(agreeData.terms_section_title ?? agreeDef.terms_section_title ?? 'Terms & Statutory Conditions');
      setAgreeClauses(Array.isArray(agreeData.terms_clauses) && agreeData.terms_clauses.length > 0 ? agreeData.terms_clauses : DEFAULT_AGREEMENT_TERMS);
      setAgreeDisclaimerTitle(agreeData.disclaimer_title ?? agreeDef.disclaimer_title ?? 'LEGAL DISCLAIMER');
      setAgreeDisclaimerText(agreeData.disclaimer_text ?? agreeDef.disclaimer_text ?? 'This document is a standard rental agreement template. Both parties may seek independent legal counsel to ensure compliance with Telangana Motor Vehicle Regulations.');
      setAgreeSignatureTitle(agreeData.signature_section_title ?? agreeDef.signature_section_title ?? 'Lessee Digital Signature');
      setAgreeSigPadLabel(agreeData.signature_pad_label ?? agreeDef.signature_pad_label ?? 'Digital Signature Pad');
      setAgreeSigPadPlaceholder(agreeData.signature_pad_placeholder ?? agreeDef.signature_pad_placeholder ?? 'Sign with your finger inside this box');
      setAgreeCheckboxText(agreeData.checkbox_text ?? agreeDef.checkbox_text ?? 'I have read, understood, and agree to all terms and conditions of this EVSMITH EV Scooter Rental Agreement.');
      setAgreeSubmitBtn(agreeData.submit_button_text ?? agreeDef.submit_button_text ?? 'Submit & Lock Agreement');

      // Sync Support Fields
      const suppDef = DEFAULT_PAGE_CONTENT.support?.content_data || {};
      const suppData = page.content_data || {};
      setSuppTitle(page.title || DEFAULT_PAGE_CONTENT.support?.title || '24/7 EVSMITH Helpline & Rider Support');
      setSuppSubtitle(page.subtitle || DEFAULT_PAGE_CONTENT.support?.subtitle || '');
      setSuppImageUrl(page.image_url || DEFAULT_PAGE_CONTENT.support?.image_url || '');
      setSuppEmail(suppData.support_email ?? suppDef.support_email ?? 'support@evsmith.com');
      setSuppPhone(suppData.support_phone ?? suppDef.support_phone ?? '+91 98765 43210');
      setSuppWhatsapp(suppData.whatsapp_number ?? suppDef.whatsapp_number ?? '+91 98765 43210');
      setSuppRoadside(suppData.roadside_assistance ?? suppDef.roadside_assistance ?? '1800 200 4567');
      setSuppHours(suppData.operating_hours ?? suppDef.operating_hours ?? '24/7 (Mon - Sun)');
      setSuppAddress(suppData.hub_address ?? suppDef.hub_address ?? 'HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081');
      setSuppNotes(suppData.emergency_notes ?? suppDef.emergency_notes ?? '');
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Sync CMS fields when tab or page changes or when pages is loaded
  useEffect(() => {
    syncCMSFormWithData(pages[cmsPageKey]);
  }, [cmsPageKey, pages[cmsPageKey]?.updated_at, pages[cmsPageKey]?.title, pages[cmsPageKey]?.image_url]);

  const handleImageUrlChange = (url: string) => {
    setCmsImageUrl(url);
    setImagePreviewError(false);
  };

  const handleLogoUrlChange = (url: string) => {
    setCmsBrandLogoUrl(url);
    setLogoPreviewError(false);
  };

  const handlePickAndUploadLogo = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingLogo(true);

      const filename = asset.fileName || `brand_logo_${Date.now()}.png`;
      const mimeType = asset.mimeType || 'image/png';
      const uri = asset.uri;

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        } as any);
      }

      const token = await getAdminToken();
      let res;
      try {
        res = await apiClient.post('/admin/upload-image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (adminUploadErr: any) {
        if (adminUploadErr.response?.status === 404) {
          res = await apiClient.post('/rider/upload-document', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          throw adminUploadErr;
        }
      }

      if (res.data?.secure_url) {
        let uploadedUrl = res.data.secure_url;
        if (uploadedUrl.includes('/raw/upload/')) {
          uploadedUrl = uploadedUrl.replace('/raw/upload/', '/image/upload/');
        }
        setCmsBrandLogoUrl(uploadedUrl);
        setLogoPreviewError(false);
        Alert.alert('Upload Successful', 'Brand logo uploaded to Cloudinary successfully!');
      } else {
        throw new Error('Upload completed without returning a secure URL.');
      }
    } catch (err: any) {
      console.warn('Logo upload notice:', err?.message);
      Alert.alert(
        'Upload Failed',
        err.message || 'Unable to upload logo image. Please verify network or paste an image URL.'
      );
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePickAndUploadImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingImage(true);

      const filename = asset.fileName || `cms_${cmsPageKey}_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const uri = asset.uri;

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        } as any);
      }

      const token = await getAdminToken();
      let res;
      try {
        res = await apiClient.post('/admin/upload-image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (adminUploadErr: any) {
        if (adminUploadErr.response?.status === 404) {
          res = await apiClient.post('/rider/upload-document', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          throw adminUploadErr;
        }
      }

      if (res.data?.secure_url) {
        let uploadedUrl = res.data.secure_url;
        if (uploadedUrl.includes('/raw/upload/')) {
          uploadedUrl = uploadedUrl.replace('/raw/upload/', '/image/upload/');
        }
        setCmsImageUrl(uploadedUrl);
        setImagePreviewError(false);
        setImageReloadKey((k) => k + 1);
        Alert.alert('Upload Successful', 'Hero image uploaded to Cloudinary and preview updated!');
      } else {
        throw new Error('Upload completed without returning a secure URL.');
      }
    } catch (err: any) {
      console.warn('Image upload notice:', err?.message);
      Alert.alert(
        'Upload Failed',
        err.message || 'Unable to upload image directly. Please verify network or paste an image URL.'
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePickAndUploadVehicleImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingVehImage(true);

      const filename = asset.fileName || `vehicle_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const uri = asset.uri;

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        } as any);
      }

      const token = await getAdminToken();
      let res;
      try {
        res = await apiClient.post('/admin/upload-image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (adminUploadErr: any) {
        if (adminUploadErr.response?.status === 404) {
          res = await apiClient.post('/rider/upload-document', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          throw adminUploadErr;
        }
      }

      if (res.data?.secure_url) {
        let uploadedUrl = res.data.secure_url;
        if (uploadedUrl.includes('/raw/upload/')) {
          uploadedUrl = uploadedUrl.replace('/raw/upload/', '/image/upload/');
        }
        setVehImageUrl(uploadedUrl);
        Alert.alert('Upload Successful', 'Scooter photo uploaded successfully!');
      } else {
        throw new Error('Upload completed without returning a secure URL.');
      }
    } catch (err: any) {
      console.warn('Vehicle photo upload notice:', err?.message);
      Alert.alert(
        'Upload Failed',
        err.message || 'Unable to upload photo. Please verify network or paste an image URL.'
      );
    } finally {
      setUploadingVehImage(false);
    }
  };

  const handlePickAndUploadFleetHeroImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingFleetHero(true);

      const filename = asset.fileName || `fleet_catalog_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const uri = asset.uri;

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        } as any);
      }

      const token = await getAdminToken();
      let res;
      try {
        res = await apiClient.post('/admin/upload-image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (adminUploadErr: any) {
        if (adminUploadErr.response?.status === 404) {
          res = await apiClient.post('/rider/upload-document', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          throw adminUploadErr;
        }
      }

      if (res.data?.secure_url) {
        let uploadedUrl = res.data.secure_url;
        if (uploadedUrl.includes('/raw/upload/')) {
          uploadedUrl = uploadedUrl.replace('/raw/upload/', '/image/upload/');
        }
        setCmsImageUrl(uploadedUrl);
        Alert.alert('Upload Successful', 'Fleet catalog banner uploaded successfully!');
      } else {
        throw new Error('Upload completed without returning a secure URL.');
      }
    } catch (err: any) {
      console.warn('Fleet banner upload notice:', err?.message);
      Alert.alert(
        'Upload Failed',
        err.message || 'Unable to upload banner image. Please verify network or paste an image URL.'
      );
    } finally {
      setUploadingFleetHero(false);
    }
  };

  const handlePickAndUploadSupportImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.85,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      setUploadingSuppImage(true);

      const filename = asset.fileName || `support_banner_${Date.now()}.jpg`;
      const mimeType = asset.mimeType || 'image/jpeg';
      const uri = asset.uri;

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const fetchRes = await fetch(uri);
        const blob = await fetchRes.blob();
        formData.append('file', blob, filename);
      } else {
        formData.append('file', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        } as any);
      }

      const token = await getAdminToken();
      let res;
      try {
        res = await apiClient.post('/admin/upload-image', formData, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (adminUploadErr: any) {
        if (adminUploadErr.response?.status === 404) {
          res = await apiClient.post('/rider/upload-document', formData, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } else {
          throw adminUploadErr;
        }
      }

      if (res.data?.secure_url) {
        let uploadedUrl = res.data.secure_url;
        if (uploadedUrl.includes('/raw/upload/')) {
          uploadedUrl = uploadedUrl.replace('/raw/upload/', '/image/upload/');
        }
        setSuppImageUrl(uploadedUrl);
        Alert.alert('Upload Successful', 'Support helpdesk banner uploaded successfully!');
      } else {
        throw new Error('Upload completed without returning a secure URL.');
      }
    } catch (err: any) {
      console.warn('Support banner upload notice:', err?.message);
      Alert.alert(
        'Upload Failed',
        err.message || 'Unable to upload image. Please verify network or paste an image URL.'
      );
    } finally {
      setUploadingSuppImage(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  // Format date & time helper
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // ==========================================
  // BOOKING ACTIONS
  // ==========================================
  const handleApproveBooking = async (bId: number) => {
    if (approvingId !== null) return;
    setApprovingId(bId);
    try {
      const token = await getAdminToken();
      await apiClient.post(
        `/admin/booking-requests/${bId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Booking Approved', `Booking #${bId} has been approved! Rider can now sign the agreement.`);
      fetchAdminData();
    } catch (err: any) {
      Alert.alert('Approval Error', err.message || 'Failed to approve booking.');
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectBooking = async (bId: number) => {
    Alert.alert(
      'Reject Booking Request',
      'Are you sure you want to reject this booking request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Reject',
          style: 'destructive',
          onPress: async () => {
            setRejectingId(bId);
            try {
              const token = await getAdminToken();
              await apiClient.post(
                `/admin/booking-requests/${bId}/reject`,
                { reason: 'Administrative verification or inventory discrepancy' },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              Alert.alert('Rejected', `Booking #${bId} rejected.`);
              fetchAdminData();
            } catch (err: any) {
              Alert.alert('Error', err.message);
            } finally {
              setRejectingId(null);
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // RIDER KYC ACTIONS
  // ==========================================
  const handleVerifyDocument = async (docId: number) => {
    try {
      const token = await getAdminToken();
      await apiClient.post(
        `/admin/documents/${docId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('Verified', 'Document successfully verified.');
      fetchAdminData();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  // ==========================================
  // VEHICLE CRUD ACTIONS
  // ==========================================
  const handleOpenAddVehicle = () => {
    setIsEditingVehicle(false);
    setEditingVehicleId(null);
    setVehMake('EVSMITH');
    setVehModel('');
    setVehVariant('Pro Edition');
    setVehReg('');
    setVehChassis('');
    setVehBattery('100');
    setVehRange('120');
    setVehSpeed('85');
    setVehDailyRate('350');
    setVehDeposit('2000');
    setVehStatus('AVAILABLE');
    setVehImageUrl('https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80');
    setVehStationId(stations[0]?.id || 1);
    setVehFeatures('Warp Mode, Fast DC Charging (0-80% in 18 min), Dual Disc Brakes, Regenerative Braking, Smart GPS Telemetry');
    setVehImageInputMode('upload');
    setShowVehicleModal(true);
  };

  const handleOpenEditVehicle = (v: Vehicle) => {
    setIsEditingVehicle(true);
    setEditingVehicleId(v.id);
    setVehMake(v.make);
    setVehModel(v.model);
    setVehVariant(v.variant);
    setVehReg(v.registration_number);
    setVehChassis(v.chassis_number);
    setVehBattery(String(v.battery_percentage));
    setVehRange(String(v.range_km));
    setVehSpeed(String(v.top_speed_kmh || 85));
    setVehDailyRate(String(v.daily_rate));
    setVehDeposit(String(v.deposit_amount));
    setVehStatus(v.status);
    setVehImageUrl(v.image_url);
    setVehStationId(v.station_id || (stations[0]?.id || 1));
    setVehFeatures((v as any).features || '');
    setVehImageInputMode('upload');
    setShowVehicleModal(true);
  };

  const handleSaveVehicle = async () => {
    if (!vehMake.trim() || !vehModel.trim() || !vehReg.trim()) {
      Alert.alert('Missing Info', 'Please enter Make, Model, and Registration Number.');
      return;
    }
    setSavingVehicle(true);
    try {
      const token = await getAdminToken();
      const payload = {
        station_id: vehStationId,
        make: vehMake.trim(),
        model: vehModel.trim(),
        variant: vehVariant.trim(),
        registration_number: vehReg.trim(),
        chassis_number: vehChassis.trim() || `CHASSIS-${Date.now()}`,
        battery_percentage: parseInt(vehBattery, 10) || 100,
        range_km: parseInt(vehRange, 10) || 100,
        top_speed_kmh: parseInt(vehSpeed, 10) || 85,
        daily_rate: parseFloat(vehDailyRate) || 299,
        deposit_amount: parseFloat(vehDeposit) || 1500,
        status: vehStatus,
        image_url: vehImageUrl.trim(),
        features: vehFeatures.trim(),
      };

      if (isEditingVehicle && editingVehicleId) {
        await apiClient.put(`/admin/vehicles/${editingVehicleId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Vehicle Updated', 'Vehicle card and highlights updated successfully!');
      } else {
        await apiClient.post('/admin/vehicles', payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Alert.alert('Vehicle Added', 'New vehicle card added to fleet successfully!');
      }

      setShowVehicleModal(false);
      fetchAdminData();
    } catch (err: any) {
      Alert.alert('Save Failed', err.message || 'Unable to save vehicle.');
    } finally {
      setSavingVehicle(false);
    }
  };

  const handleDeleteVehicle = async (vId: number, regNo: string) => {
    Alert.alert(
      'Delete Vehicle',
      `Are you sure you want to delete vehicle ${regNo}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAdminToken();
              await apiClient.delete(`/admin/vehicles/${vId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              Alert.alert('Deleted', 'Vehicle deleted from fleet.');
              fetchAdminData();
            } catch (err: any) {
              Alert.alert('Delete Failed', err.message);
            }
          },
        },
      ]
    );
  };

  // ==========================================
  // CMS SAVE ACTION
  // ==========================================
  const handleSaveCMS = async () => {
    setSavingCMS(true);
    try {
      const page = pages[cmsPageKey] || DEFAULT_PAGE_CONTENT[cmsPageKey];
      const partial: any = {
        title: cmsTitle.trim(),
        subtitle: cmsSubtitle.trim(),
        image_url: cmsImageUrl.trim(),
        content_data: {
          ...(page.content_data || {}),
        },
      };

      if (cmsPageKey === 'welcome') {
        partial.content_data.brand_logo_url = cmsBrandLogoUrl.trim();
        partial.content_data.brand_name = cmsBrandName.trim() || 'EVSMITH';
        partial.content_data.brand_accent = cmsBrandAccent.trim() || 'MOBILITY';
        partial.content_data.tagline = cmsSubtitle.trim();
        partial.content_data.cta_button = cmsCta.trim() || 'Get Started';
        partial.content_data.login_button = cmsLogin.trim() || 'I have an account';
      } else if (cmsPageKey === 'fleet') {
        partial.content_data.banner_text = cmsBanner.trim();
        partial.content_data.support_phone = cmsSupportPhone.trim();
      } else if (cmsPageKey === 'agreement') {
        partial.title = agreeHeaderTitle.trim() || 'Rental Agreement';
        partial.subtitle = agreeDocTitle.trim() || 'EV SCOOTER RENTAL AGREEMENT';
        partial.content_data = {
          ...(page.content_data || {}),
          header_title: agreeHeaderTitle.trim(),
          doc_title: agreeDocTitle.trim(),
          doc_subtitle: agreeDocSubtitle.trim(),
          doc_version: agreeDocVersion.trim(),
          lessor_section_title: agreeLessorSection.trim(),
          lessor_business_name: agreeLessorBusiness.trim(),
          lessor_registered_hub: agreeLessorHub.trim(),
          lessee_section_title: agreeLesseeSection.trim(),
          label_legal_name: agreeLabelName.trim(),
          label_contact_phone: agreeLabelPhone.trim(),
          label_dob: agreeLabelDob.trim(),
          label_address: agreeLabelAddress.trim(),
          terms_section_title: agreeTermsHeader.trim(),
          terms_clauses: agreeClauses,
          disclaimer_title: agreeDisclaimerTitle.trim(),
          disclaimer_text: agreeDisclaimerText.trim(),
          signature_section_title: agreeSignatureTitle.trim(),
          signature_pad_label: agreeSigPadLabel.trim(),
          signature_pad_placeholder: agreeSigPadPlaceholder.trim(),
          checkbox_text: agreeCheckboxText.trim(),
          submit_button_text: agreeSubmitBtn.trim(),
        };
      } else if (cmsPageKey === 'support') {
        partial.title = suppTitle.trim() || '24/7 EVSMITH Helpline & Rider Support';
        partial.subtitle = suppSubtitle.trim();
        partial.image_url = suppImageUrl.trim();
        partial.content_data = {
          ...(page.content_data || {}),
          support_email: suppEmail.trim(),
          support_phone: suppPhone.trim(),
          whatsapp_number: suppWhatsapp.trim(),
          roadside_assistance: suppRoadside.trim(),
          operating_hours: suppHours.trim(),
          hub_address: suppAddress.trim(),
          emergency_notes: suppNotes.trim(),
        };
      }

      await updateCMSContent(cmsPageKey, partial);
      const freshPages = useAppContentStore.getState().pages;
      syncCMSFormWithData(freshPages[cmsPageKey]);
      Alert.alert('Published!', `CMS changes for ${cmsPageKey.toUpperCase()} page published live and saved permanently.`);
    } catch (err: any) {
      Alert.alert('Publish Failed', err.message || 'Unable to save content changes.');
    } finally {
      setSavingCMS(false);
    }
  };

  const handleUpdateClause = (index: number, field: 'title' | 'text', value: string) => {
    setAgreeClauses((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddClause = () => {
    setAgreeClauses((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: `${prev.length + 1}. Custom Condition`,
        text: 'Enter agreement conditions and statutory guidelines here.',
      },
    ]);
  };

  const handleRemoveClause = (index: number) => {
    setAgreeClauses((prev) => prev.filter((_, i) => i !== index));
  };

  const handleResetAgreementDefaults = () => {
    Alert.alert(
      'Reset Agreement to Defaults?',
      'This will reset all titles, labels, statutory clauses, and legal disclaimers back to the default contract standard.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: () => {
            const agreeDef = DEFAULT_PAGE_CONTENT.agreement?.content_data || {};
            setAgreeHeaderTitle(agreeDef.header_title || 'Rental Agreement');
            setAgreeDocTitle(agreeDef.doc_title || 'EV SCOOTER RENTAL AGREEMENT');
            setAgreeDocSubtitle(agreeDef.doc_subtitle || 'EVSMITH Mobility Services (Hyderabad)');
            setAgreeDocVersion(agreeDef.doc_version || 'v1.0-TS-2026');
            setAgreeLessorSection(agreeDef.lessor_section_title || '1. LESSOR / OWNER');
            setAgreeLessorBusiness(agreeDef.lessor_business_name || 'EVSmith Mobility Services');
            setAgreeLessorHub(agreeDef.lessor_registered_hub || 'HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081');
            setAgreeLesseeSection(agreeDef.lessee_section_title || '2. LESSEE / RIDER');
            setAgreeLabelName(agreeDef.label_legal_name || 'Full Legal Name');
            setAgreeLabelPhone(agreeDef.label_contact_phone || 'Contact Mobile');
            setAgreeLabelDob(agreeDef.label_dob || 'Date of Birth (DOB)');
            setAgreeLabelAddress(agreeDef.label_address || 'Current Address');
            setAgreeTermsHeader(agreeDef.terms_section_title || 'Terms & Statutory Conditions');
            setAgreeClauses(DEFAULT_AGREEMENT_TERMS);
            setAgreeDisclaimerTitle(agreeDef.disclaimer_title || 'LEGAL DISCLAIMER');
            setAgreeDisclaimerText(agreeDef.disclaimer_text || 'This document is a standard rental agreement template. Both parties may seek independent legal counsel to ensure compliance with Telangana Motor Vehicle Regulations.');
            setAgreeSignatureTitle(agreeDef.signature_section_title || 'Lessee Digital Signature');
            setAgreeSigPadLabel(agreeDef.signature_pad_label || 'Digital Signature Pad');
            setAgreeSigPadPlaceholder(agreeDef.signature_pad_placeholder || 'Sign with your finger inside this box');
            setAgreeCheckboxText(agreeDef.checkbox_text || 'I have read, understood, and agree to all terms and conditions of this EVSMITH EV Scooter Rental Agreement.');
            setAgreeSubmitBtn(agreeDef.submit_button_text || 'Submit & Lock Agreement');
          },
        },
      ]
    );
  };

  const handleResetSupportDefaults = () => {
    Alert.alert(
      'Reset Support Helpdesk to Defaults?',
      'This will reset contact helpline, email, WhatsApp, roadside assistance and hub address back to defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: () => {
            const def = DEFAULT_PAGE_CONTENT.support;
            const data = def.content_data || {};
            setSuppTitle(def.title);
            setSuppSubtitle(def.subtitle);
            setSuppImageUrl(def.image_url);
            setSuppEmail(data.support_email || 'support@evsmith.com');
            setSuppPhone(data.support_phone || '+91 98765 43210');
            setSuppWhatsapp(data.whatsapp_number || '+91 98765 43210');
            setSuppRoadside(data.roadside_assistance || '1800 200 4567');
            setSuppHours(data.operating_hours || '24/7 (Mon - Sun)');
            setSuppAddress(data.hub_address || 'HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081');
            setSuppNotes(data.emergency_notes || '');
          },
        },
      ]
    );
  };

  const handleResetWelcomeDefaults = () => {
    Alert.alert(
      'Reset Welcome Page to Defaults?',
      'This will reset your brand name, headline, tagline, buttons, and hero image back to the factory defaults.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Defaults',
          style: 'destructive',
          onPress: () => {
            const def = DEFAULT_PAGE_CONTENT.welcome;
            setCmsBrandLogoUrl(def.content_data?.brand_logo_url || '');
            setCmsBrandName(def.content_data?.brand_name || 'EVSMITH');
            setCmsBrandAccent(def.content_data?.brand_accent || 'MOBILITY');
            setCmsTitle(def.title);
            setCmsSubtitle(def.subtitle);
            setCmsImageUrl(def.image_url);
            setCmsCta(def.content_data?.cta_button || 'Get Started');
            setCmsLogin(def.content_data?.login_button || 'I have an account');
            setLogoPreviewError(false);
            setImagePreviewError(false);
            setImageReloadKey((k) => k + 1);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.titleRow}>
            <ShieldCheck size={22} color={colors.secondary} />
            <Text style={styles.title}>Super Admin Console</Text>
          </View>
          <Text style={styles.subtitle}>
            Fleet, KYC, Bookings & Supreme App CMS
          </Text>
        </View>
      </View>

      {/* 4 Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'BOOKINGS' && styles.tabActive]}
          onPress={() => setActiveTab('BOOKINGS')}
        >
          <Text style={[styles.tabText, activeTab === 'BOOKINGS' && styles.tabTextActive]}>
            Requests ({bookings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'RIDERS' && styles.tabActive]}
          onPress={() => setActiveTab('RIDERS')}
        >
          <Text style={[styles.tabText, activeTab === 'RIDERS' && styles.tabTextActive]}>
            Riders ({riders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'FLEET' && styles.tabActive]}
          onPress={() => setActiveTab('FLEET')}
        >
          <Text style={[styles.tabText, activeTab === 'FLEET' && styles.tabTextActive]}>
            Fleet ({vehicles.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'CMS' && styles.tabActive]}
          onPress={() => setActiveTab('CMS')}
        >
          <Text style={[styles.tabText, activeTab === 'CMS' && styles.tabTextActive]}>
            CMS ✨
          </Text>
        </TouchableOpacity>
      </View>

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
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : activeTab === 'BOOKINGS' ? (
          /* ==========================================
             TAB 1: IN-DETAIL BOOKING REQUESTS
             ========================================== */
          bookings.length === 0 ? (
            <Text style={styles.emptyText}>No booking requests found.</Text>
          ) : (
            bookings.map((b) => {
              const riderName =
                b.rider?.full_name ||
                riders.find((r) => r.user_id === b.rider_id)?.full_name ||
                'Registered Rider';

              const riderPhone =
                b.rider?.phone ||
                riders.find((r) => r.user_id === b.rider_id)?.phone ||
                'N/A';

              const riderEmail =
                b.rider?.email ||
                riders.find((r) => r.user_id === b.rider_id)?.email ||
                'N/A';

              // Find approval time
              let approvalTime = b.approved_at;
              if (!approvalTime && b.status_history) {
                const appHist = b.status_history.find((h) =>
                  ['APPROVED', 'AGREEMENT_REQUIRED', 'HANDOVER_REQUIRED', 'ACTIVE'].includes(h.new_status)
                );
                if (appHist) approvalTime = appHist.created_at;
              }

              const canApprove = ['PENDING', 'UNDER_REVIEW'].includes(b.status);

              return (
                <View key={b.id} style={styles.card}>
                  {/* Top Bar: Booking ID & Status */}
                  <View style={styles.cardHeader}>
                    <Text style={styles.bookingRef}>#{b.booking_number}</Text>
                    <StatusBadge status={b.status} size="sm" />
                  </View>

                  {/* Rider In-Detail Info Card */}
                  <View style={styles.riderHighlightBox}>
                    <View style={styles.riderHeaderRow}>
                      <User size={16} color={colors.primary} />
                      <Text style={styles.riderName}>{riderName}</Text>
                      <View style={styles.kycPill}>
                        <Text style={styles.kycPillText}>
                          {b.rider?.verification_status || 'VERIFIED'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.riderContactRow}>
                      <Phone size={12} color={colors.textMuted} />
                      <Text style={styles.contactText}>{riderPhone}</Text>
                      <Text style={{ color: colors.surfaceBorder }}>•</Text>
                      <Mail size={12} color={colors.textMuted} />
                      <Text style={styles.contactText}>{riderEmail}</Text>
                    </View>
                  </View>

                  {/* Vehicle & Pricing Info */}
                  <Text style={styles.cardVehicle}>
                    {b.vehicle?.make} {b.vehicle?.model} ({b.vehicle?.registration_number})
                  </Text>
                  <Text style={styles.cardMeta}>
                    {b.duration_days} Days • Total: ₹{b.total_amount} (Rent: ₹{b.rental_amount} + Dep: ₹{b.deposit_amount})
                  </Text>

                  {/* Detailed Timestamps */}
                  <View style={styles.timestampsBox}>
                    <View style={styles.timestampItem}>
                      <Clock size={13} color={colors.primary} />
                      <Text style={styles.timestampLabel}>Requested:</Text>
                      <Text style={styles.timestampVal}>{formatDateTime(b.created_at)}</Text>
                    </View>

                    {approvalTime ? (
                      <View style={styles.timestampItem}>
                        <CheckCircle2 size={13} color={colors.secondary} />
                        <Text style={styles.timestampLabel}>Accepted:</Text>
                        <Text style={styles.timestampVal}>{formatDateTime(approvalTime)}</Text>
                      </View>
                    ) : (
                      <View style={styles.timestampItem}>
                        <Info size={13} color={colors.warning} />
                        <Text style={styles.timestampLabel}>Accepted:</Text>
                        <Text style={[styles.timestampVal, { color: colors.warning }]}>Pending Review</Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.btnRow}>
                    {canApprove && (
                      <EVButton
                        title="Approve Booking"
                        onPress={() => handleApproveBooking(b.id)}
                        loading={approvingId === b.id}
                        variant="primary"
                        size="sm"
                        style={{ flex: 1.2 }}
                      />
                    )}

                    {canApprove && (
                      <EVButton
                        title="Reject"
                        onPress={() => handleRejectBooking(b.id)}
                        loading={rejectingId === b.id}
                        variant="danger"
                        size="sm"
                        style={{ flex: 0.8 }}
                      />
                    )}

                    <EVButton
                      title="View Details"
                      onPress={() => setDetailBooking(b)}
                      variant="outline"
                      size="sm"
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              );
            })
          )
        ) : activeTab === 'RIDERS' ? (
          /* ==========================================
             TAB 2: RIDERS & IDENTITY KYC
             ========================================== */
          riders.length === 0 ? (
            <Text style={styles.emptyText}>No registered riders.</Text>
          ) : (
            riders.map((r) => (
              <View key={r.user_id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardVehicle}>{r.full_name || 'Anonymous'}</Text>
                  <View
                    style={[
                      styles.kycPill,
                      r.is_profile_complete && { borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.kycPillText,
                        r.is_profile_complete && { color: colors.primary },
                      ]}
                    >
                      {r.is_profile_complete ? 'PROFILE COMPLETE' : 'PENDING DOCS'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.cardMeta}>
                  {r.email} • {r.phone} • {r.occupation || 'Self'}
                </Text>

                {r.documents && r.documents.length > 0 ? (
                  <View style={styles.docsSection}>
                    <Text style={styles.docTitle}>Uploaded Identity Documents:</Text>
                    {r.documents.map((doc) => (
                      <View key={doc.id} style={styles.docRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.docType}>
                            {doc.document_type}: {doc.document_number}
                          </Text>
                          <Text style={styles.docStatus}>
                            Status: {doc.verification_status}
                          </Text>
                        </View>
                        {doc.verification_status !== 'VERIFIED' && (
                          <EVButton
                            title="Verify ID"
                            onPress={() => handleVerifyDocument(doc.id)}
                            variant="secondary"
                            size="sm"
                          />
                        )}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.docStatus}>No documents uploaded yet.</Text>
                )}
              </View>
            ))
          )
        ) : activeTab === 'FLEET' ? (
          /* ==========================================
             TAB 3: FLEET MANAGEMENT (CRUD VEHICLES)
             ========================================== */
          <View>
            <TouchableOpacity
              style={styles.addVehicleBtn}
              onPress={handleOpenAddVehicle}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#080C0E" />
              <Text style={styles.addVehicleBtnText}>+ Add New Vehicle Card</Text>
            </TouchableOpacity>

            {vehicles.map((v) => (
              <View key={v.id} style={styles.vehicleCard}>
                <Image
                  source={{ uri: v.image_url || 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800' }}
                  style={styles.vehicleCardImg}
                  resizeMode="cover"
                />
                <View style={styles.vehicleCardBody}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.vehicleCardTitle}>{v.make} {v.model}</Text>
                      <Text style={styles.vehicleCardReg}>{v.registration_number}</Text>
                    </View>
                    <StatusBadge status={v.status} size="sm" />
                  </View>

                  <View style={styles.vehicleSpecsRow}>
                    <Text style={styles.specChip}>⚡ {v.battery_percentage}% Battery</Text>
                    <Text style={styles.specChip}>🛣️ {v.range_km} km</Text>
                    <Text style={styles.specChip}>₹{v.daily_rate}/day</Text>
                    <Text style={styles.specChip}>Dep: ₹{v.deposit_amount}</Text>
                  </View>

                  <View style={styles.vehicleActionsRow}>
                    <TouchableOpacity
                      style={styles.editVehBtn}
                      onPress={() => handleOpenEditVehicle(v)}
                    >
                      <Edit3 size={15} color={colors.primary} />
                      <Text style={styles.editVehBtnText}>Edit Vehicle Card</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteVehBtn}
                      onPress={() => handleDeleteVehicle(v.id, v.registration_number)}
                    >
                      <Trash2 size={15} color="#FF4D4D" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          /* ==========================================
             TAB 4: APP CONTENT & CMS (SUPREME POWERS)
             ========================================== */
          <View style={styles.cmsContainer}>
            <Text style={styles.sectionHeader}>Supreme Powers: Edit App Content & Images</Text>
            <Text style={styles.cmsSubtitle}>
              Edit headlines, descriptions, button labels, and images across every page in the app.
            </Text>

            {/* Page Sub-Tabs with Icons */}
            <View style={styles.cmsSubTabs}>
              {([
                { key: 'welcome', label: 'WELCOME', icon: Zap },
                { key: 'fleet', label: 'FLEET', icon: ShieldCheck },
                { key: 'agreement', label: 'AGREEMENT', icon: FileText },
                { key: 'support', label: 'SUPPORT', icon: Phone },
              ] as const).map((tab) => {
                const TabIcon = tab.icon;
                const isActive = cmsPageKey === tab.key;
                return (
                  <TouchableOpacity
                    key={tab.key}
                    style={[styles.cmsSubTab, isActive && styles.cmsSubTabActive]}
                    onPress={() => setCmsPageKey(tab.key)}
                    activeOpacity={0.7}
                  >
                    <TabIcon size={12} color={isActive ? colors.primary : colors.textMuted} />
                    <Text
                      style={[
                        styles.cmsSubTabText,
                        isActive && styles.cmsSubTabTextActive,
                      ]}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {cmsPageKey === 'welcome' ? (
              <View style={styles.cmsCardsStack}>
                {/* SECTION CARD 1: BRAND IDENTITY & LOGO */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <Sparkles size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Brand Identity & Logo</Text>
                        <Text style={styles.proCardSub}>Header identity displayed at top of onboarding</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>App Header</Text>
                    </View>
                  </View>

                  {/* Brand Name & Suffix Row */}
                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1.2 }}>
                      <EVInput
                        label="Brand Name"
                        value={cmsBrandName}
                        onChangeText={setCmsBrandName}
                        placeholder="e.g. EVSMITH"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Accent / Suffix"
                        value={cmsBrandAccent}
                        onChangeText={setCmsBrandAccent}
                        placeholder="e.g. MOBILITY"
                      />
                    </View>
                  </View>

                  {/* Live Brand Header Preview Bar */}
                  <View style={styles.liveBrandHeaderPreview}>
                    <Text style={styles.miniPreviewLabel}>LIVE HEADER PREVIEW</Text>
                    <View style={styles.mockHeaderContent}>
                      {cmsBrandLogoUrl && cmsBrandLogoUrl.trim() && !logoPreviewError ? (
                        <View style={styles.mockLogoWrap}>
                          <Image
                            source={{
                              uri: cmsBrandLogoUrl.trim().includes('/raw/upload/')
                                ? cmsBrandLogoUrl.trim().replace('/raw/upload/', '/image/upload/')
                                : cmsBrandLogoUrl.trim(),
                            }}
                            style={styles.mockLogoImg}
                            resizeMode="contain"
                          />
                        </View>
                      ) : (
                        <View style={styles.mockDefaultBadge}>
                          <Zap size={16} color="#080C0E" fill="#080C0E" />
                        </View>
                      )}
                      <Text style={styles.mockBrandTitle}>
                        {cmsBrandName || 'EVSMITH'}{' '}
                        <Text style={{ color: colors.primary }}>{cmsBrandAccent || 'MOBILITY'}</Text>
                      </Text>
                      <Text style={styles.mockTaglineText} numberOfLines={1}>
                        {cmsSubtitle || 'Trusted Local EV Rental in Hyderabad'}
                      </Text>
                    </View>
                  </View>

                  {/* Brand Logo Upload / URL Switcher */}
                  <View style={styles.modeSwitcherContainer}>
                    <Text style={styles.fieldSectionLabel}>Official Brand Logo</Text>
                    <View style={styles.segmentedRow}>
                      <TouchableOpacity
                        style={[styles.segmentBtn, logoInputMode === 'upload' && styles.segmentBtnActive]}
                        onPress={() => setLogoInputMode('upload')}
                        activeOpacity={0.8}
                      >
                        <Upload size={13} color={logoInputMode === 'upload' ? colors.primary : colors.textMuted} />
                        <Text style={[styles.segmentBtnText, logoInputMode === 'upload' && styles.segmentBtnTextActive]}>
                          Upload Image
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, logoInputMode === 'url' && styles.segmentBtnActive]}
                        onPress={() => setLogoInputMode('url')}
                        activeOpacity={0.8}
                      >
                        <Link2 size={13} color={logoInputMode === 'url' ? colors.primary : colors.textMuted} />
                        <Text style={[styles.segmentBtnText, logoInputMode === 'url' && styles.segmentBtnTextActive]}>
                          Paste URL
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {logoInputMode === 'upload' ? (
                    <TouchableOpacity
                      style={styles.actionUploadBtn}
                      onPress={handlePickAndUploadLogo}
                      disabled={uploadingLogo}
                      activeOpacity={0.85}
                    >
                      {uploadingLogo ? (
                        <ActivityIndicator size="small" color="#080C0E" />
                      ) : (
                        <Upload size={16} color="#080C0E" />
                      )}
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.actionUploadBtnText}>
                          {uploadingLogo ? 'Uploading to Cloudinary...' : 'Choose Logo File from Device'}
                        </Text>
                        <Text style={styles.actionUploadBtnSub}>PNG, WEBP, or SVG transparent recommended</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <EVInput
                      label="Logo Direct URL"
                      value={cmsBrandLogoUrl}
                      onChangeText={handleLogoUrlChange}
                      placeholder="https://.../brand_logo.png"
                      leftElement={<Link2 size={16} color={colors.primary} />}
                    />
                  )}

                  {/* Logo Status Bar */}
                  {cmsBrandLogoUrl ? (
                    <View style={styles.logoStatusBar}>
                      <View style={styles.logoThumbBox}>
                        <Image
                          source={{
                            uri: cmsBrandLogoUrl.trim().includes('/raw/upload/')
                              ? cmsBrandLogoUrl.trim().replace('/raw/upload/', '/image/upload/')
                              : cmsBrandLogoUrl.trim(),
                          }}
                          style={styles.logoThumbImg}
                          resizeMode="contain"
                          onError={() => setLogoPreviewError(true)}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.logoStatusTitle}>Custom Logo Active</Text>
                        <Text style={styles.logoStatusUrl} numberOfLines={1}>
                          {cmsBrandLogoUrl}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.resetLogoPill}
                        onPress={() => {
                          setCmsBrandLogoUrl('');
                          setLogoPreviewError(false);
                        }}
                      >
                        <RotateCcw size={12} color={colors.error} />
                        <Text style={styles.resetLogoPillText}>Reset</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.defaultBadgeNotice}>
                      <Zap size={14} color={colors.primary} fill={colors.primary} />
                      <Text style={styles.defaultBadgeNoticeText}>
                        Using default lightning badge (upload a custom logo above to replace)
                      </Text>
                    </View>
                  )}
                </View>

                {/* SECTION CARD 2: HERO VISUAL MEDIA */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <ImageIcon size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Hero Showcase Visual</Text>
                        <Text style={styles.proCardSub}>High-resolution banner featured in screen center</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>Main Canvas</Text>
                    </View>
                  </View>

                  {/* Mode switcher */}
                  <View style={styles.modeSwitcherContainer}>
                    <Text style={styles.fieldSectionLabel}>Select Image Source</Text>
                    <View style={styles.segmentedRow}>
                      <TouchableOpacity
                        style={[styles.segmentBtn, heroInputMode === 'upload' && styles.segmentBtnActive]}
                        onPress={() => setHeroInputMode('upload')}
                        activeOpacity={0.8}
                      >
                        <Upload size={13} color={heroInputMode === 'upload' ? colors.primary : colors.textMuted} />
                        <Text style={[styles.segmentBtnText, heroInputMode === 'upload' && styles.segmentBtnTextActive]}>
                          Upload Photo
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.segmentBtn, heroInputMode === 'url' && styles.segmentBtnActive]}
                        onPress={() => setHeroInputMode('url')}
                        activeOpacity={0.8}
                      >
                        <Link2 size={13} color={heroInputMode === 'url' ? colors.primary : colors.textMuted} />
                        <Text style={[styles.segmentBtnText, heroInputMode === 'url' && styles.segmentBtnTextActive]}>
                          Direct URL
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {heroInputMode === 'upload' ? (
                    <TouchableOpacity
                      style={styles.actionUploadBtn}
                      onPress={handlePickAndUploadImage}
                      disabled={uploadingImage}
                      activeOpacity={0.85}
                    >
                      {uploadingImage ? (
                        <ActivityIndicator size="small" color="#080C0E" />
                      ) : (
                        <Upload size={16} color="#080C0E" />
                      )}
                      <View style={{ alignItems: 'center' }}>
                        <Text style={styles.actionUploadBtnText}>
                          {uploadingImage ? 'Uploading Image to Cloudinary...' : 'Upload Image from Device (Gallery / File)'}
                        </Text>
                        <Text style={styles.actionUploadBtnSub}>16:9 or 4:3 high-resolution landscape photo recommended</Text>
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <EVInput
                      label="Direct Image URL"
                      value={cmsImageUrl}
                      onChangeText={handleImageUrlChange}
                      placeholder="https://images.unsplash.com/..."
                      leftElement={<Link2 size={16} color={colors.primary} />}
                    />
                  )}

                  {/* Hero Live Phone Screen Preview */}
                  <View style={styles.heroPreviewFrame}>
                    <View style={styles.frameHeaderRow}>
                      <View style={styles.frameStatusPill}>
                        <View style={styles.pulsingDot} />
                        <Text style={styles.frameStatusText}>Live Screen Preview</Text>
                      </View>
                      {cmsImageUrl ? (
                        <TouchableOpacity
                          style={styles.reloadPreviewBtn}
                          onPress={() => {
                            setImagePreviewError(false);
                            setImageReloadKey((k) => k + 1);
                          }}
                        >
                          <RefreshCw size={11} color={colors.primary} />
                          <Text style={styles.reloadPreviewText}>Refresh</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>

                    {cmsImageUrl && cmsImageUrl.trim() ? (
                      imagePreviewError ? (
                        <View style={styles.previewErrorFrame}>
                          <AlertTriangle size={24} color="#FF9900" />
                          <Text style={styles.previewErrorTitle}>Preview Unavailable</Text>
                          <Text style={styles.previewErrorMsg}>
                            Could not load image from URL. It may have expired or blocked cross-origin requests. Use the upload button above.
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.mockScreenVisualWrap}>
                          <Image
                            key={`preview-hero-${imageReloadKey}`}
                            source={{
                              uri: cmsImageUrl.trim().includes('/raw/upload/')
                                ? cmsImageUrl.trim().replace('/raw/upload/', '/image/upload/')
                                : cmsImageUrl.trim(),
                            }}
                            style={styles.mockScreenVisualImg}
                            resizeMode="cover"
                            onError={() => setImagePreviewError(true)}
                          />
                          <View style={styles.mockScreenOverlay} />
                          
                          {/* Live floating pill overlays matching WelcomeScreen */}
                          <View style={styles.mockPillLeft}>
                            <Cpu size={11} color={colors.primary} />
                            <Text style={styles.mockPillText}>Smart Telemetry</Text>
                          </View>
                          <View style={styles.mockPillRight}>
                            <ShieldCheck size={11} color={colors.secondary} />
                            <Text style={styles.mockPillText}>Insured Rides</Text>
                          </View>
                        </View>
                      )
                    ) : (
                      <View style={styles.mockScreenEmpty}>
                        <ImageIcon size={28} color={colors.textMuted} />
                        <Text style={styles.mockScreenEmptyText}>No image selected</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* SECTION CARD 3: HEADLINES & MARKETING MESSAGING */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <FileText size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Headlines & Copywriting</Text>
                        <Text style={styles.proCardSub}>Primary title & tagline displayed on Welcome page</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>Copywriting</Text>
                    </View>
                  </View>

                  <EVInput
                    label="Primary Headline / Catchphrase"
                    value={cmsTitle}
                    onChangeText={setCmsTitle}
                    placeholder="e.g. EARN WITH ELECTRIC"
                  />

                  <EVInput
                    label="Subtitle / Local Tagline"
                    value={cmsSubtitle}
                    onChangeText={setCmsSubtitle}
                    placeholder="e.g. Trusted Local EV Rental in Hyderabad"
                    multiline
                  />
                </View>

                {/* SECTION CARD 4: CALL TO ACTION BUTTONS */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <Sliders size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Action Buttons (CTA)</Text>
                        <Text style={styles.proCardSub}>Registration and sign-in button copy</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>Navigation</Text>
                    </View>
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Primary CTA (Registration)"
                        value={cmsCta}
                        onChangeText={setCmsCta}
                        placeholder="e.g. Get Started"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Secondary CTA (Login)"
                        value={cmsLogin}
                        onChangeText={setCmsLogin}
                        placeholder="e.g. I have an account"
                      />
                    </View>
                  </View>

                  {/* Buttons Live Preview Chips */}
                  <View style={styles.buttonPreviewRow}>
                    <View style={styles.btnChipPrimary}>
                      <Text style={styles.btnChipPrimaryText}>{cmsCta || 'Get Started'}</Text>
                    </View>
                    <View style={styles.btnChipSecondary}>
                      <Text style={styles.btnChipSecondaryText}>{cmsLogin || 'I have an account'}</Text>
                    </View>
                  </View>
                </View>

                {/* SECTION CARD 5: SAVE & PUBLISH ACTION BAR */}
                <View style={styles.publishActionCard}>
                  <EVButton
                    title="Publish Changes to Live App"
                    onPress={handleSaveCMS}
                    loading={savingCMS}
                    variant="primary"
                    size="lg"
                    icon={<Sparkles size={18} color="#080C0E" />}
                  />

                  <TouchableOpacity
                    style={styles.resetAllBtn}
                    onPress={handleResetWelcomeDefaults}
                    disabled={savingCMS}
                  >
                    <RotateCcw size={14} color={colors.textSecondary} />
                    <Text style={styles.resetAllBtnText}>Reset Welcome Page to Factory Defaults</Text>
                  </TouchableOpacity>

                  <View style={styles.syncNoticeRow}>
                    <CheckCircle2 size={13} color={colors.primary} />
                    <Text style={styles.syncNoticeText}>
                      Updates persist permanently and sync immediately to all active rider apps.
                    </Text>
                  </View>
                </View>
              </View>
            ) : cmsPageKey === 'fleet' ? (
              <View style={styles.cmsCardsStack}>
                {/* FLEET SCREEN EXPLANATION & LIVE BANNER PREVIEW */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <Zap size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Fleet Catalog (Home Screen)</Text>
                        <Text style={styles.proCardSub}>Controls 1st tab in bottom bar where riders browse EVs</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>1st App Tab</Text>
                    </View>
                  </View>

                  {/* Live Promo Banner Preview */}
                  <View style={styles.liveBrandHeaderPreview}>
                    <Text style={styles.miniPreviewLabel}>LIVE PROMOTIONAL BANNER PREVIEW</Text>
                    <View style={{ width: '100%' }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(0, 229, 153, 0.1)',
                          borderWidth: 1,
                          borderColor: 'rgba(0, 229, 153, 0.3)',
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 10,
                          gap: 8,
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Sparkles size={14} color={colors.primary} />
                          <Text style={{ color: colors.textPrimary, fontSize: 12, fontWeight: '700', flex: 1 }}>
                            {cmsBanner || '⚡ Special Offer: Save on weekly & monthly rentals!'}
                          </Text>
                        </View>
                        {cmsSupportPhone ? (
                          <View
                            style={{
                              backgroundColor: colors.primary,
                              paddingHorizontal: 8,
                              paddingVertical: 4,
                              borderRadius: 6,
                            }}
                          >
                            <Text style={{ color: '#080C0E', fontSize: 10, fontWeight: '800' }}>Help</Text>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </View>

                {/* CARD 2: PROMOTIONAL ANNOUNCEMENT & HELPLINE */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <Sparkles size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Promotions & Support Helpline</Text>
                        <Text style={styles.proCardSub}>Banner displayed at the top of the Fleet home screen</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>Alert Bar</Text>
                    </View>
                  </View>

                  <EVInput
                    label="Promotional Announcement Banner"
                    value={cmsBanner}
                    onChangeText={setCmsBanner}
                    placeholder="e.g. ⚡ Special Offer: Save on weekly & monthly rentals!"
                    multiline
                  />

                  <EVInput
                    label="24/7 Roadside & Helpline Phone Number"
                    value={cmsSupportPhone}
                    onChangeText={setCmsSupportPhone}
                    placeholder="e.g. +91 98765 43210"
                    leftElement={<Phone size={16} color={colors.primary} />}
                  />
                </View>

                {/* CARD 3: CATALOG HEADINGS */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <FileText size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Fleet Catalog Headings</Text>
                        <Text style={styles.proCardSub}>Header above the station chips and vehicle cards</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>Catalog Title</Text>
                    </View>
                  </View>

                  <EVInput
                    label="Catalog Section Title"
                    value={cmsTitle}
                    onChangeText={setCmsTitle}
                    placeholder="e.g. Available EV Fleet"
                  />

                  <EVInput
                    label="Catalog Subtitle / Description"
                    value={cmsSubtitle}
                    onChangeText={setCmsSubtitle}
                    placeholder="e.g. Choose your premium electric scooter. Fully charged and ready for immediate pickup."
                    multiline
                  />
                </View>

                {/* CARD 4: FLEET HERO / CATALOG BANNER IMAGE */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <ImageIcon size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Fleet Catalog Banner Image</Text>
                        <Text style={styles.proCardSub}>Background hero image on the catalog page</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>IMAGE</Text>
                    </View>
                  </View>

                  {/* Mode Selector */}
                  <View style={styles.inputModeToggleRow}>
                    <TouchableOpacity
                      style={[styles.inputModeBtn, fleetHeroInputMode === 'upload' && styles.inputModeBtnActive]}
                      onPress={() => setFleetHeroInputMode('upload')}
                      activeOpacity={0.7}
                    >
                      <Upload size={12} color={fleetHeroInputMode === 'upload' ? '#080C0E' : colors.textMuted} />
                      <Text style={[styles.inputModeText, fleetHeroInputMode === 'upload' && styles.inputModeTextActive]}>
                        Upload from Device
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inputModeBtn, fleetHeroInputMode === 'url' && styles.inputModeBtnActive]}
                      onPress={() => setFleetHeroInputMode('url')}
                      activeOpacity={0.7}
                    >
                      <Link2 size={12} color={fleetHeroInputMode === 'url' ? '#080C0E' : colors.textMuted} />
                      <Text style={[styles.inputModeText, fleetHeroInputMode === 'url' && styles.inputModeTextActive]}>
                        Image URL
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {fleetHeroInputMode === 'upload' ? (
                    <TouchableOpacity
                      style={styles.vehUploadBtn}
                      onPress={handlePickAndUploadFleetHeroImage}
                      disabled={uploadingFleetHero}
                      activeOpacity={0.7}
                    >
                      {uploadingFleetHero ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Upload size={16} color={colors.primary} />
                          <Text style={styles.vehUploadBtnText}>Select Fleet Banner from Gallery / Device</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <EVInput
                      label="Image Direct URL"
                      value={cmsImageUrl}
                      onChangeText={handleImageUrlChange}
                      placeholder="https://..."
                    />
                  )}

                  {cmsImageUrl ? (
                    <View style={styles.vehPreviewCard}>
                      <Image
                        source={{ uri: cmsImageUrl }}
                        style={styles.vehPreviewImg}
                        resizeMode="cover"
                      />
                      <View style={styles.vehPreviewOverlay}>
                        <Text style={styles.vehPreviewBadgeText}>Catalog Banner Preview</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* CARD 5: PUBLISH BAR */}
                <View style={styles.publishActionCard}>
                  <EVButton
                    title="Publish Changes to Fleet Screen"
                    onPress={handleSaveCMS}
                    loading={savingCMS}
                    variant="primary"
                    size="lg"
                    icon={<Sparkles size={18} color="#080C0E" />}
                  />

                  <View style={styles.syncNoticeRow}>
                    <CheckCircle2 size={13} color={colors.primary} />
                    <Text style={styles.syncNoticeText}>
                      Updates persist permanently and sync immediately to all active rider apps.
                    </Text>
                  </View>
                </View>
              </View>
            ) : cmsPageKey === 'agreement' ? (
              <View style={styles.cmsCardsStack}>
                {/* CARD 1: DOCUMENT HEADER & BRANDING */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <FileText size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Document Header & Branding</Text>
                        <Text style={styles.proCardSub}>Header bar title, agreement title, sub-entity & version</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>LEGAL DOC</Text>
                    </View>
                  </View>

                  <EVInput
                    label="Top Header Bar Title"
                    value={agreeHeaderTitle}
                    onChangeText={setAgreeHeaderTitle}
                    placeholder="Rental Agreement"
                  />

                  <EVInput
                    label="Contract Document Title (Center Highlight)"
                    value={agreeDocTitle}
                    onChangeText={setAgreeDocTitle}
                    placeholder="EV SCOOTER RENTAL AGREEMENT"
                  />

                  <EVInput
                    label="Company Sub-Entity Line"
                    value={agreeDocSubtitle}
                    onChangeText={setAgreeDocSubtitle}
                    placeholder="EVSMITH Mobility Services (Hyderabad)"
                  />

                  <EVInput
                    label="Agreement Version / Reference Code"
                    value={agreeDocVersion}
                    onChangeText={setAgreeDocVersion}
                    placeholder="v1.0-TS-2026"
                  />
                </View>

                {/* CARD 2: LESSOR / OWNER CREDENTIALS */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <ShieldCheck size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>1. Lessor / Owner Credentials</Text>
                        <Text style={styles.proCardSub}>Owner business name and registered hub location</Text>
                      </View>
                    </View>
                  </View>

                  <EVInput
                    label="Section 1 Heading"
                    value={agreeLessorSection}
                    onChangeText={setAgreeLessorSection}
                    placeholder="1. LESSOR / OWNER"
                  />

                  <EVInput
                    label="Business Legal Name"
                    value={agreeLessorBusiness}
                    onChangeText={setAgreeLessorBusiness}
                    placeholder="EVSmith Mobility Services"
                  />

                  <EVInput
                    label="Registered Hub Address"
                    value={agreeLessorHub}
                    onChangeText={setAgreeLessorHub}
                    placeholder="HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081"
                    multiline
                  />
                </View>

                {/* CARD 3: LESSEE / RIDER FORM LABELS */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <User size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>2. Lessee / Rider Field Labels</Text>
                        <Text style={styles.proCardSub}>Customise each input label in the rider details card</Text>
                      </View>
                    </View>
                  </View>

                  <EVInput
                    label="Section 2 Heading"
                    value={agreeLesseeSection}
                    onChangeText={setAgreeLesseeSection}
                    placeholder="2. LESSEE / RIDER"
                  />

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Full Name Label"
                        value={agreeLabelName}
                        onChangeText={setAgreeLabelName}
                        placeholder="Full Legal Name"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Mobile Label"
                        value={agreeLabelPhone}
                        onChangeText={setAgreeLabelPhone}
                        placeholder="Contact Mobile"
                      />
                    </View>
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="DOB Label"
                        value={agreeLabelDob}
                        onChangeText={setAgreeLabelDob}
                        placeholder="Date of Birth (DOB)"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Address Label"
                        value={agreeLabelAddress}
                        onChangeText={setAgreeLabelAddress}
                        placeholder="Current Address"
                      />
                    </View>
                  </View>
                </View>

                {/* CARD 4: TERMS & STATUTORY CONDITIONS (11+ CLAUSES) */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <Sliders size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Terms & Statutory Clauses</Text>
                        <Text style={styles.proCardSub}>Edit all {agreeClauses.length} clauses word-for-word, add or remove</Text>
                      </View>
                    </View>
                  </View>

                  <EVInput
                    label="Terms Section Heading"
                    value={agreeTermsHeader}
                    onChangeText={setAgreeTermsHeader}
                    placeholder="Terms & Statutory Conditions"
                  />

                  <Text style={[styles.miniPreviewLabel, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>
                    INDIVIDUAL CLAUSES ({agreeClauses.length})
                  </Text>

                  {agreeClauses.map((clause, idx) => (
                    <View key={clause.id ?? idx} style={styles.clauseItemCard}>
                      <View style={styles.clauseHeaderRow}>
                        <View style={styles.clauseIndexBadge}>
                          <Text style={styles.clauseIndexText}>Clause #{idx + 1}</Text>
                        </View>
                        {agreeClauses.length > 1 && (
                          <TouchableOpacity
                            style={styles.clauseDeleteBtn}
                            onPress={() => handleRemoveClause(idx)}
                            activeOpacity={0.7}
                          >
                            <Trash2 size={13} color="#FF4D4D" />
                          </TouchableOpacity>
                        )}
                      </View>
                      <EVInput
                        label="Clause Heading"
                        value={clause.title}
                        onChangeText={(val) => handleUpdateClause(idx, 'title', val)}
                        placeholder={`Clause ${idx + 1} Title`}
                      />
                      <EVInput
                        label="Clause Legal Text"
                        value={clause.text}
                        onChangeText={(val) => handleUpdateClause(idx, 'text', val)}
                        placeholder="Enter full legal stipulation..."
                        multiline
                      />
                    </View>
                  ))}

                  <TouchableOpacity
                    style={styles.addClauseBtn}
                    onPress={handleAddClause}
                    activeOpacity={0.7}
                  >
                    <Plus size={14} color={colors.primary} />
                    <Text style={styles.addClauseBtnText}>Add Another Legal Clause</Text>
                  </TouchableOpacity>
                </View>

                {/* CARD 5: DISCLAIMER & DIGITAL SIGNATURE */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <AlertTriangle size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Disclaimer & Signature Pad</Text>
                        <Text style={styles.proCardSub}>Customise warning notice, signature prompt & consent checkbox</Text>
                      </View>
                    </View>
                  </View>

                  <EVInput
                    label="Legal Disclaimer Box Title"
                    value={agreeDisclaimerTitle}
                    onChangeText={setAgreeDisclaimerTitle}
                    placeholder="LEGAL DISCLAIMER"
                  />

                  <EVInput
                    label="Legal Disclaimer Full Text"
                    value={agreeDisclaimerText}
                    onChangeText={setAgreeDisclaimerText}
                    placeholder="Statutory disclaimer text..."
                    multiline
                  />

                  <EVInput
                    label="Signature Section Heading"
                    value={agreeSignatureTitle}
                    onChangeText={setAgreeSignatureTitle}
                    placeholder="Lessee Digital Signature"
                  />

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Pad Title Label"
                        value={agreeSigPadLabel}
                        onChangeText={setAgreeSigPadLabel}
                        placeholder="Digital Signature Pad"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <EVInput
                        label="Pad Placeholder Text"
                        value={agreeSigPadPlaceholder}
                        onChangeText={setAgreeSigPadPlaceholder}
                        placeholder="Sign with your finger inside this box"
                      />
                    </View>
                  </View>

                  <EVInput
                    label="Agreement Checkbox Statement"
                    value={agreeCheckboxText}
                    onChangeText={setAgreeCheckboxText}
                    placeholder="I have read, understood, and agree..."
                    multiline
                  />

                  <EVInput
                    label="Submit & Lock Button Text"
                    value={agreeSubmitBtn}
                    onChangeText={setAgreeSubmitBtn}
                    placeholder="Submit & Lock Agreement"
                  />
                </View>

                {/* CARD 6: PUBLISH & RESET BAR */}
                <View style={styles.publishActionCard}>
                  <EVButton
                    title="Publish Changes to Rental Agreement"
                    onPress={handleSaveCMS}
                    loading={savingCMS}
                    variant="primary"
                    size="lg"
                    icon={<Sparkles size={18} color="#080C0E" />}
                  />

                  <TouchableOpacity
                    style={styles.resetAllBtn}
                    onPress={handleResetAgreementDefaults}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={14} color={colors.textSecondary} />
                    <Text style={styles.resetAllBtnText}>Reset Agreement to Factory Defaults</Text>
                  </TouchableOpacity>

                  <View style={styles.syncNoticeRow}>
                    <CheckCircle2 size={13} color={colors.primary} />
                    <Text style={styles.syncNoticeText}>
                      Updates persist permanently and sync immediately to all active rider apps.
                    </Text>
                  </View>
                </View>
              </View>
            ) : cmsPageKey === 'support' ? (
              <View style={styles.cmsCardsStack}>
                {/* CARD 1: HELPDESK TITLE & BANNER */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <Phone size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Helpdesk Branding & Banner</Text>
                        <Text style={styles.proCardSub}>Controls rider support title, tagline & banner image</Text>
                      </View>
                    </View>
                    <View style={styles.liveChipBadge}>
                      <Text style={styles.liveChipText}>SUPPORT</Text>
                    </View>
                  </View>

                  <EVInput
                    label="Helpdesk Screen Title"
                    value={suppTitle}
                    onChangeText={setSuppTitle}
                    placeholder="24/7 EVSMITH Helpline & Rider Support"
                  />

                  <EVInput
                    label="Helpdesk Tagline / Subtitle"
                    value={suppSubtitle}
                    onChangeText={setSuppSubtitle}
                    placeholder="Dedicated roadside assistance, battery swap, and rental support in Hyderabad."
                    multiline
                  />

                  {/* Mode Selector */}
                  <View style={styles.inputModeToggleRow}>
                    <TouchableOpacity
                      style={[styles.inputModeBtn, supportHeroInputMode === 'upload' && styles.inputModeBtnActive]}
                      onPress={() => setSupportHeroInputMode('upload')}
                      activeOpacity={0.7}
                    >
                      <Upload size={12} color={supportHeroInputMode === 'upload' ? '#080C0E' : colors.textMuted} />
                      <Text style={[styles.inputModeText, supportHeroInputMode === 'upload' && styles.inputModeTextActive]}>
                        Upload from Device
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inputModeBtn, supportHeroInputMode === 'url' && styles.inputModeBtnActive]}
                      onPress={() => setSupportHeroInputMode('url')}
                      activeOpacity={0.7}
                    >
                      <Link2 size={12} color={supportHeroInputMode === 'url' ? '#080C0E' : colors.textMuted} />
                      <Text style={[styles.inputModeText, supportHeroInputMode === 'url' && styles.inputModeTextActive]}>
                        Image URL
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {supportHeroInputMode === 'upload' ? (
                    <TouchableOpacity
                      style={styles.vehUploadBtn}
                      onPress={handlePickAndUploadSupportImage}
                      disabled={uploadingSuppImage}
                      activeOpacity={0.7}
                    >
                      {uploadingSuppImage ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <Upload size={16} color={colors.primary} />
                          <Text style={styles.vehUploadBtnText}>Select Helpdesk Banner from Gallery / Device</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <EVInput
                      label="Banner Image URL"
                      value={suppImageUrl}
                      onChangeText={setSuppImageUrl}
                      placeholder="https://..."
                    />
                  )}

                  {suppImageUrl ? (
                    <View style={styles.vehPreviewCard}>
                      <Image
                        source={{ uri: suppImageUrl }}
                        style={styles.vehPreviewImg}
                        resizeMode="cover"
                      />
                      <View style={styles.vehPreviewOverlay}>
                        <Text style={styles.vehPreviewBadgeText}>Support Banner Preview</Text>
                      </View>
                    </View>
                  ) : null}
                </View>

                {/* CARD 2: DIRECT CONTACT CHANNELS */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <Phone size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Direct Contact Channels</Text>
                        <Text style={styles.proCardSub}>One-tap calling, WhatsApp chat & email assistance</Text>
                      </View>
                    </View>
                  </View>

                  <EVInput
                    label="24/7 Roadside Assistance Hotline (Toll-Free)"
                    value={suppRoadside}
                    onChangeText={setSuppRoadside}
                    placeholder="1800 200 4567"
                    leftElement={<ShieldCheck size={16} color={colors.primary} />}
                  />

                  <EVInput
                    label="Customer Care Phone Helpline"
                    value={suppPhone}
                    onChangeText={setSuppPhone}
                    placeholder="+91 98765 43210"
                    leftElement={<Phone size={16} color={colors.primary} />}
                  />

                  <EVInput
                    label="WhatsApp Chat Helpline Number"
                    value={suppWhatsapp}
                    onChangeText={setSuppWhatsapp}
                    placeholder="+91 98765 43210"
                    leftElement={<MessageSquare size={16} color="#25D366" />}
                  />

                  <EVInput
                    label="Official Customer Support Email"
                    value={suppEmail}
                    onChangeText={setSuppEmail}
                    placeholder="support@evsmith.com"
                    leftElement={<Mail size={16} color={colors.secondary} />}
                  />
                </View>

                {/* CARD 3: OPERATIONS & PHYSICAL HUB */}
                <View style={styles.proCmsCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.cardHeaderLeft}>
                      <View style={styles.cardIconBox}>
                        <MapPin size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={styles.proCardTitle}>Operations & Physical Hub</Text>
                        <Text style={styles.proCardSub}>Operational schedule and registered physical address</Text>
                      </View>
                    </View>
                  </View>

                  <EVInput
                    label="Operating Hours / Availability"
                    value={suppHours}
                    onChangeText={setSuppHours}
                    placeholder="24/7 (Mon - Sun)"
                    leftElement={<Clock size={16} color={colors.primary} />}
                  />

                  <EVInput
                    label="Physical Hub Address"
                    value={suppAddress}
                    onChangeText={setSuppAddress}
                    placeholder="HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081"
                    multiline
                  />

                  <EVInput
                    label="Emergency Dispatch Policy Note"
                    value={suppNotes}
                    onChangeText={setSuppNotes}
                    placeholder="In case of breakdown or battery drain, field rescue arrives within 30 minutes."
                    multiline
                  />
                </View>

                {/* CARD 4: PUBLISH & RESET BAR */}
                <View style={styles.publishActionCard}>
                  <EVButton
                    title="Publish Changes to Help & Support"
                    onPress={handleSaveCMS}
                    loading={savingCMS}
                    variant="primary"
                    size="lg"
                    icon={<Sparkles size={18} color="#080C0E" />}
                  />

                  <TouchableOpacity
                    style={styles.resetAllBtn}
                    onPress={handleResetSupportDefaults}
                    activeOpacity={0.7}
                  >
                    <RotateCcw size={14} color={colors.textSecondary} />
                    <Text style={styles.resetAllBtnText}>Reset Support to Factory Defaults</Text>
                  </TouchableOpacity>

                  <View style={styles.syncNoticeRow}>
                    <CheckCircle2 size={13} color={colors.primary} />
                    <Text style={styles.syncNoticeText}>
                      Updates persist permanently and sync immediately to all active rider apps.
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* IN-DETAIL BOOKING MODAL */}
      <Modal
        visible={Boolean(detailBooking)}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailBooking(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Booking #{detailBooking?.booking_number}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setDetailBooking(null)}
              >
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%', maxHeight: 520 }}>
              {/* Rider Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Rider Information</Text>
                <Text style={styles.modalInfoRow}>
                  Name: {detailBooking?.rider?.full_name || 'Registered Rider'}
                </Text>
                <Text style={styles.modalInfoRow}>
                  Contact: {detailBooking?.rider?.phone || 'N/A'}
                </Text>
                <Text style={styles.modalInfoRow}>
                  Email: {detailBooking?.rider?.email || 'N/A'}
                </Text>
                {detailBooking?.rider?.dob ? (
                  <Text style={styles.modalInfoRow}>
                    Date of Birth: {detailBooking.rider.dob}
                  </Text>
                ) : null}
              </View>

              {/* Vehicle Section */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Vehicle & Pricing</Text>
                <Text style={styles.modalInfoRow}>
                  Model: {detailBooking?.vehicle?.make} {detailBooking?.vehicle?.model}
                </Text>
                <Text style={styles.modalInfoRow}>
                  Registration: {detailBooking?.vehicle?.registration_number}
                </Text>
                <Text style={styles.modalInfoRow}>
                  Duration: {detailBooking?.duration_days} Days (₹{detailBooking?.rental_amount})
                </Text>
                <Text style={styles.modalInfoRow}>
                  Deposit: ₹{detailBooking?.deposit_amount} | Total: ₹{detailBooking?.total_amount}
                </Text>
              </View>

              {/* Status Timeline */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Audit & Lifecycle Timeline</Text>
                <Text style={styles.modalInfoRow}>
                  • Request Sent: {formatDateTime(detailBooking?.created_at)}
                </Text>
                {detailBooking?.status_history?.map((hist) => (
                  <Text key={hist.id} style={styles.modalInfoRow}>
                    • {hist.new_status}: {formatDateTime(hist.created_at)} ({hist.remarks || 'Status updated'})
                  </Text>
                ))}
              </View>

              {/* Agreement details if available */}
              {detailBooking?.agreement && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Signed Rental Agreement</Text>
                  <Text style={styles.modalInfoRow}>
                    Signed By: {detailBooking.agreement.lessee_name}
                  </Text>
                  <Text style={styles.modalInfoRow}>
                    Phone: {detailBooking.agreement.lessee_phone}
                  </Text>
                  <Text style={styles.modalInfoRow}>
                    Signed At: {formatDateTime(detailBooking.agreement.signed_at)}
                  </Text>
                </View>
              )}

              {/* Handover details if available */}
              {detailBooking?.handover && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Station Handover Inspection</Text>
                  <Text style={styles.modalInfoRow}>
                    Battery: {detailBooking.handover.battery_percentage_at_handover}%
                  </Text>
                  <Text style={styles.modalInfoRow}>
                    Tyres: {detailBooking.handover.tyres_condition} | Brakes: {detailBooking.handover.brakes_condition}
                  </Text>
                  <Text style={styles.modalInfoRow}>
                    Handover Time: {formatDateTime(detailBooking.handover.handover_timestamp)}
                  </Text>
                  <Text style={styles.modalInfoRow}>
                    Notes: {detailBooking.handover.inspector_notes || 'None'}
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* EDIT / ADD VEHICLE MODAL */}
      <Modal
        visible={showVehicleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditingVehicle ? 'Edit Vehicle Card' : 'Add New Vehicle to Fleet'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setShowVehicleModal(false)}
              >
                <X size={20} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ width: '100%', maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* VEHICLE PHOTO & DEVICE UPLOAD */}
              <Text style={styles.fieldSectionLabel}>Scooter Photo</Text>
              <Text style={styles.fieldSectionSub}>Upload an image from your device or paste a web URL</Text>

              {/* Mode Toggle */}
              <View style={styles.inputModeToggleRow}>
                <TouchableOpacity
                  style={[styles.inputModeBtn, vehImageInputMode === 'upload' && styles.inputModeBtnActive]}
                  onPress={() => setVehImageInputMode('upload')}
                  activeOpacity={0.7}
                >
                  <Upload size={12} color={vehImageInputMode === 'upload' ? '#080C0E' : colors.textMuted} />
                  <Text style={[styles.inputModeText, vehImageInputMode === 'upload' && styles.inputModeTextActive]}>
                    Upload from Device
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inputModeBtn, vehImageInputMode === 'url' && styles.inputModeBtnActive]}
                  onPress={() => setVehImageInputMode('url')}
                  activeOpacity={0.7}
                >
                  <Link2 size={12} color={vehImageInputMode === 'url' ? '#080C0E' : colors.textMuted} />
                  <Text style={[styles.inputModeText, vehImageInputMode === 'url' && styles.inputModeTextActive]}>
                    Image URL
                  </Text>
                </TouchableOpacity>
              </View>

              {vehImageInputMode === 'upload' ? (
                <TouchableOpacity
                  style={styles.vehUploadBtn}
                  onPress={handlePickAndUploadVehicleImage}
                  disabled={uploadingVehImage}
                  activeOpacity={0.7}
                >
                  {uploadingVehImage ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Upload size={16} color={colors.primary} />
                      <Text style={styles.vehUploadBtnText}>Select Scooter Photo from Gallery / Device</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : (
                <EVInput
                  label="Image URL"
                  value={vehImageUrl}
                  onChangeText={setVehImageUrl}
                  placeholder="https://..."
                />
              )}

              {vehImageUrl ? (
                <View style={styles.vehPreviewCard}>
                  <Image
                    source={{ uri: vehImageUrl }}
                    style={styles.vehPreviewImg}
                    resizeMode="cover"
                  />
                  <View style={styles.vehPreviewOverlay}>
                    <Text style={styles.vehPreviewBadgeText}>{vehMake} {vehModel || 'Vehicle'}</Text>
                  </View>
                </View>
              ) : null}

              {/* BRAND, MODEL & VARIANT */}
              <Text style={styles.fieldSectionLabel}>Vehicle Identity</Text>
              <EVInput label="Make (Brand)" value={vehMake} onChangeText={setVehMake} placeholder="e.g. EVSMITH" />
              <EVInput label="Model" value={vehModel} onChangeText={setVehModel} placeholder="e.g. Apex 450 or S1 Pro" />
              <EVInput label="Variant" value={vehVariant} onChangeText={setVehVariant} placeholder="e.g. Hyper Edition or Electric Performance" />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <EVInput label="Registration Number" value={vehReg} onChangeText={setVehReg} placeholder="TS 08 EV 8890" containerStyle={{ flex: 1 }} />
                <EVInput label="Chassis Number" value={vehChassis} onChangeText={setVehChassis} placeholder="EVS-2026-CH-..." containerStyle={{ flex: 1 }} />
              </View>

              {/* PERFORMANCE SPECS */}
              <Text style={styles.fieldSectionLabel}>EV Performance Specifications</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <EVInput label="Battery %" value={vehBattery} onChangeText={setVehBattery} keyboardType="numeric" containerStyle={{ flex: 1 }} placeholder="100" />
                <EVInput label="Range (km)" value={vehRange} onChangeText={setVehRange} keyboardType="numeric" containerStyle={{ flex: 1 }} placeholder="150" />
                <EVInput label="Top Speed" value={vehSpeed} onChangeText={setVehSpeed} keyboardType="numeric" containerStyle={{ flex: 1 }} placeholder="95" />
              </View>

              {/* PRICING & DEPOSIT */}
              <Text style={styles.fieldSectionLabel}>Rental Rates</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <EVInput label="Daily Rate (₹)" value={vehDailyRate} onChangeText={setVehDailyRate} keyboardType="numeric" containerStyle={{ flex: 1 }} placeholder="450" />
                <EVInput label="Security Deposit (₹)" value={vehDeposit} onChangeText={setVehDeposit} keyboardType="numeric" containerStyle={{ flex: 1 }} placeholder="2500" />
              </View>

              {/* OPERATIONAL STATUS */}
              <Text style={styles.fieldSectionLabel}>Operational Status</Text>
              <View style={styles.statusChipsRow}>
                {['AVAILABLE', 'RENTED', 'MAINTENANCE', 'RESERVED'].map((st) => {
                  const isCur = vehStatus === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.statusChip, isCur && styles.statusChipActive]}
                      onPress={() => setVehStatus(st)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.statusChipText, isCur && styles.statusChipTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* PICKUP & HANDOVER HUB LOCATION */}
              <Text style={styles.fieldSectionLabel}>Pickup & Handover Hub Location</Text>
              <Text style={styles.fieldSectionSub}>Select the physical hub where riders pick up and return this scooter</Text>

              <View style={styles.stationsListContainer}>
                {(stations.length > 0 ? stations : [
                  { id: 1, name: 'HITEC City Main Hub', code: 'HYD-HITEC-01', address: 'Cyber Towers Junction, Madhapur' },
                  { id: 2, name: 'Gachibowli Financial District Hub', code: 'HYD-GACH-02', address: 'Opposite WaveRock SEZ, Nanakramguda' },
                  { id: 3, name: 'Jubilee Hills Metro Station Hub', code: 'HYD-JUB-03', address: 'Road No. 36 Metro Pillar 1400' },
                ]).map((st: any) => {
                  const isSelected = vehStationId === st.id;
                  return (
                    <TouchableOpacity
                      key={st.id}
                      style={[styles.stationSelectCard, isSelected && styles.stationSelectCardActive]}
                      onPress={() => setVehStationId(st.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.stationSelectHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <MapPin size={14} color={isSelected ? colors.primary : colors.textMuted} />
                          <Text style={[styles.stationSelectName, isSelected && styles.stationSelectNameActive]}>
                            {st.name}
                          </Text>
                        </View>
                        {isSelected && <CheckCircle2 size={16} color={colors.primary} />}
                      </View>
                      <Text style={styles.stationSelectAddr} numberOfLines={1}>{st.address}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* SCOOTER HIGHLIGHTS / FEATURES */}
              <Text style={styles.fieldSectionLabel}>Scooter Highlights / Features</Text>
              <Text style={styles.fieldSectionSub}>Bullet points displayed on rider vehicle detail screen (comma-separated)</Text>
              <EVInput
                label="Highlights List (comma-separated)"
                value={vehFeatures}
                onChangeText={setVehFeatures}
                placeholder="e.g. Warp, Fast DC Charging (0-80% in 18 min), Dual Disc, Sport, Smart Telemetry"
                multiline
              />

              <View style={styles.modalBtnRow}>
                <EVButton title="Cancel" onPress={() => setShowVehicleModal(false)} variant="ghost" size="sm" style={{ flex: 1 }} />
                <EVButton title={isEditingVehicle ? 'Save Changes' : 'Create Vehicle'} onPress={handleSaveVehicle} loading={savingVehicle} variant="primary" size="sm" style={{ flex: 1.4 }} />
              </View>
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  profileHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    gap: 6,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  tabActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  bookingRef: {
    color: colors.primary,
    fontFamily: 'monospace',
    fontWeight: '700',
    fontSize: 13,
  },
  riderHighlightBox: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm + 2,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  riderHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riderName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  kycPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.secondary,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
  },
  kycPillText: {
    color: colors.secondary,
    fontSize: 9,
    fontWeight: '800',
  },
  riderContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  contactText: {
    color: colors.textMuted,
    fontSize: 11,
  },
  cardVehicle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  cardMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 3,
  },
  timestampsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginVertical: spacing.sm,
    gap: 4,
  },
  timestampItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timestampLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    width: 68,
  },
  timestampVal: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  docsSection: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
    paddingTop: spacing.sm,
  },
  docTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  docType: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  docStatus: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  addVehicleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  addVehicleBtnText: {
    color: '#080C0E',
    fontSize: 14,
    fontWeight: '800',
  },
  vehicleCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.cardBorder,
    marginBottom: spacing.md,
  },
  vehicleCardImg: {
    width: '100%',
    height: 140,
  },
  vehicleCardBody: {
    padding: spacing.md,
  },
  vehicleCardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  vehicleCardReg: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  vehicleSpecsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: spacing.sm,
  },
  specChip: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  vehicleActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceBorder,
  },
  editVehBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
  },
  editVehBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteVehBtn: {
    padding: 6,
  },
  cmsContainer: {
    paddingVertical: spacing.xs,
  },
  cmsCardsStack: {
    gap: spacing.md,
  },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  cmsSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
    marginBottom: spacing.md,
  },
  cmsSubTabs: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.md,
  },
  cmsSubTab: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 8,
    backgroundColor: colors.surfaceLight,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  cmsSubTabActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
  },
  cmsSubTabText: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  cmsSubTabTextActive: {
    color: colors.primary,
  },
  proCmsCard: {
    backgroundColor: colors.surface,
    padding: spacing.md + 2,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: spacing.sm,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  cardIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  proCardSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  liveChipBadge: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  liveChipText: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '700',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  liveBrandHeaderPreview: {
    backgroundColor: '#060A0D',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  miniPreviewLabel: {
    color: colors.primary,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  mockHeaderContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  mockLogoWrap: {
    height: 40,
    width: 130,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  mockLogoImg: {
    width: '100%',
    height: '100%',
  },
  mockDefaultBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  mockBrandTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  mockTaglineText: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
    textAlign: 'center',
  },
  modeSwitcherContainer: {
    marginBottom: spacing.sm,
  },
  fieldSectionLabel: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: '#080E13',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: spacing.xs,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.3)',
  },
  segmentBtnText: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  segmentBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  actionUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: spacing.sm,
  },
  actionUploadBtnText: {
    color: '#080C0E',
    fontSize: 13,
    fontWeight: '800',
  },
  actionUploadBtnSub: {
    color: '#1B3026',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  logoStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    padding: 8,
    marginTop: 4,
  },
  logoThumbBox: {
    width: 52,
    height: 36,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  logoThumbImg: {
    width: '100%',
    height: '100%',
  },
  logoStatusTitle: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  logoStatusUrl: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 1,
  },
  resetLogoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 77, 77, 0.25)',
  },
  resetLogoPillText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: '700',
  },
  defaultBadgeNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 229, 153, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.18)',
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
  },
  defaultBadgeNoticeText: {
    color: colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  heroPreviewFrame: {
    backgroundColor: '#05080A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    padding: 10,
    marginTop: 4,
  },
  frameHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  frameStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.primary,
  },
  frameStatusText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  reloadPreviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceLight,
  },
  reloadPreviewText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  mockScreenVisualWrap: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#000',
  },
  mockScreenVisualImg: {
    width: '100%',
    height: '100%',
  },
  mockScreenOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  mockPillLeft: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8, 12, 14, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.3)',
  },
  mockPillRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(8, 12, 14, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  mockPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  mockScreenEmpty: {
    height: 130,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    borderRadius: 10,
    borderStyle: 'dashed',
    backgroundColor: colors.surfaceLight,
  },
  mockScreenEmptyText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 6,
  },
  previewErrorFrame: {
    backgroundColor: 'rgba(255, 153, 0, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 153, 0, 0.25)',
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },
  previewErrorTitle: {
    color: '#FF9900',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 6,
    marginBottom: 4,
  },
  previewErrorMsg: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
  },
  buttonPreviewRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.xs,
  },
  btnChipPrimary: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnChipPrimaryText: {
    color: '#080C0E',
    fontSize: 12,
    fontWeight: '800',
  },
  btnChipSecondary: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnChipSecondaryText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  publishActionCard: {
    backgroundColor: '#0D151D',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 153, 0.35)',
    padding: spacing.md + 2,
    marginBottom: spacing.xxl,
    gap: spacing.sm,
  },
  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  resetAllBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  syncNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  syncNoticeText: {
    color: colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  clauseItemCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.sm,
    gap: 6,
  },
  clauseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clauseIndexBadge: {
    backgroundColor: 'rgba(0, 229, 153, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  clauseIndexText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '800',
  },
  clauseDeleteBtn: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 77, 77, 0.1)',
  },
  addClauseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(0, 229, 153, 0.05)',
    marginTop: 4,
  },
  addClauseBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.surfaceBorder,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalSection: {
    backgroundColor: colors.surfaceLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  modalSectionTitle: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalInfoRow: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  vehPreviewCard: {
    height: 140,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    marginVertical: spacing.sm,
    backgroundColor: '#080C0E',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 153, 0.2)',
  },
  vehPreviewImg: {
    width: '100%',
    height: '100%',
  },
  vehPreviewOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  vehPreviewBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  vehUploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 229, 153, 0.35)',
    borderStyle: 'dashed',
    borderRadius: borderRadius.md,
    paddingVertical: 14,
    marginVertical: 6,
  },
  vehUploadBtnText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  statusChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  statusChipActive: {
    backgroundColor: 'rgba(0, 229, 153, 0.15)',
    borderColor: colors.primary,
  },
  statusChipText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  statusChipTextActive: {
    color: colors.primary,
  },
  stationsListContainer: {
    gap: 6,
    marginVertical: 6,
  },
  stationSelectCard: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  stationSelectCardActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 229, 153, 0.08)',
  },
  stationSelectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stationSelectName: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  stationSelectNameActive: {
    color: colors.primary,
  },
  stationSelectAddr: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    marginLeft: 20,
  },
  fieldSectionSub: {
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 6,
  },
  inputModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#080E13',
    borderRadius: 8,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
    marginBottom: 10,
    gap: 4,
  },
  inputModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    gap: 6,
  },
  inputModeBtnActive: {
    backgroundColor: colors.primary,
  },
  inputModeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  inputModeTextActive: {
    color: '#080C0E',
    fontWeight: '700',
  },
});
