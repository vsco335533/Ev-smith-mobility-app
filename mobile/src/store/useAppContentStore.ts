import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../api/client';

export interface PageContent {
  page_key: string;
  title: string;
  subtitle: string;
  image_url: string;
  content_data: Record<string, any>;
  updated_at?: string;
}

interface AppContentState {
  pages: Record<string, PageContent>;
  isLoading: boolean;
  fetchContent: () => Promise<void>;
  updatePageContent: (pageKey: string, partial: Partial<PageContent>) => Promise<void>;
  getContent: (pageKey: string, field: 'title' | 'subtitle' | 'image_url', defaultVal: string) => string;
  getDataField: (pageKey: string, fieldKey: string, defaultVal: string) => string;
}

export const DEFAULT_AGREEMENT_TERMS = [
  {
    id: 1,
    title: '1. Lessee (Rider) Declaration',
    text: 'I declare that I possess a valid Driving Licence, am medically fit to ride, will obey all traffic rules, will not ride under the influence of alcohol or drugs, will wear a helmet at all times, and will not allow any unauthorized person to ride the scooter.',
  },
  {
    id: 2,
    title: '2. Owner Responsibilities',
    text: 'The scooter is delivered in good working condition. The Owner warrants that valid Registration Certificate (RC), comprehensive Insurance, and periodic fitness maintenance are up to date.',
  },
  {
    id: 3,
    title: '3. Lessee Responsibilities',
    text: 'The Rider shall return the scooter in the same condition (normal wear and tear excepted), inform the Owner immediately in case of accident or breakdown, never tamper with the GPS device, and keep the battery charged according to instructions.',
  },
  {
    id: 4,
    title: '4. Accident Clause',
    text: 'If an accident occurs, the rider must immediately inform the Owner, cooperate with police and insurance formalities, and not admit liability without authorization.',
  },
  {
    id: 5,
    title: '5. Traffic Challans',
    text: 'All traffic penalties and e-challans generated during the rental period shall be paid by the Rider. Delayed challans paid by Owner will be deducted from security deposit.',
  },
  {
    id: 6,
    title: '6. Theft',
    text: 'In case of theft: Immediate police complaint is mandatory, GPS tracking shall be activated, and the Owner must be informed immediately.',
  },
  {
    id: 7,
    title: '7. Security Deposit',
    text: 'The Security Deposit may be adjusted against vehicle damages, unpaid rental dues, traffic penalties, or missing accessories. The remaining balance will be refunded within 2 working days after final settlement.',
  },
  {
    id: 8,
    title: '8. Late Return',
    text: 'Late return surcharge is ₹100 per day in addition to standard daily rental rates.',
  },
  {
    id: 9,
    title: '9. Prohibited Uses',
    text: 'The scooter shall NOT be used for racing, stunts, illegal activities, carrying hazardous cargo, commercial delivery unless permitted, or riding outside approved geographic boundaries.',
  },
  {
    id: 10,
    title: '10. GPS Tracking',
    text: 'The Rider acknowledges and consents that the EV scooter is equipped with GPS telemetry for security, geofencing, and fleet safety.',
  },
  {
    id: 11,
    title: '11. Jurisdiction',
    text: 'Any disputes arising out of this agreement shall be subject to the exclusive jurisdiction of the competent courts in Hyderabad, Telangana.',
  },
];

export const DEFAULT_PAGE_CONTENT: Record<string, PageContent> = {
  welcome: {
    page_key: 'welcome',
    title: 'EARN WITH ELECTRIC',
    subtitle: 'Trusted Local EV Rental in Hyderabad',
    image_url: 'https://maxtronev.com/assets/Blog30-Bt25-yDw.webp',
    content_data: {
      brand_logo_url: '',
      brand_name: 'EVSMITH',
      brand_accent: 'MOBILITY',
      tagline: 'Trusted Local EV Rental in Hyderabad',
      cta_button: 'Get Started',
      login_button: 'I have an account',
      feature_1_title: 'Fast KYC Approval',
      feature_1_desc: 'Instant identity and DL verification within minutes.',
      feature_2_title: 'Smart Battery Telemetry',
      feature_2_desc: 'Live range monitoring and seamless battery management.',
      feature_3_title: 'Zero Maintenance Hassle',
      feature_3_desc: 'Comprehensive roadside support and station assistance.',
    },
  },
  fleet: {
    page_key: 'fleet',
    title: 'Explore EVSMITH Fleet',
    subtitle: 'Choose your premium electric scooter. Fully charged and ready for immediate pickup.',
    image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    content_data: {
      banner_text: '⚡ Special Offer: Save on weekly & monthly rentals!',
      support_phone: '+91 98765 43210',
    },
  },
  agreement: {
    page_key: 'agreement',
    title: 'Rental Agreement',
    subtitle: 'EV SCOOTER RENTAL AGREEMENT',
    image_url: '',
    content_data: {
      header_title: 'Rental Agreement',
      doc_title: 'EV SCOOTER RENTAL AGREEMENT',
      doc_subtitle: 'EVSMITH Mobility Services (Hyderabad)',
      doc_version: 'v1.0-TS-2026',
      lessor_section_title: '1. LESSOR / OWNER',
      lessor_business_name: 'EVSmith Mobility Services',
      lessor_registered_hub: 'HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081',
      lessee_section_title: '2. LESSEE / RIDER',
      label_legal_name: 'Full Legal Name',
      label_contact_phone: 'Contact Mobile',
      label_dob: 'Date of Birth (DOB)',
      label_address: 'Current Address',
      terms_section_title: 'Terms & Statutory Conditions',
      terms_clauses: DEFAULT_AGREEMENT_TERMS,
      disclaimer_title: 'LEGAL DISCLAIMER',
      disclaimer_text: 'This document is a standard rental agreement template. Both parties may seek independent legal counsel to ensure compliance with Telangana Motor Vehicle Regulations.',
      signature_section_title: 'Lessee Digital Signature',
      signature_pad_label: 'Digital Signature Pad',
      signature_pad_placeholder: 'Sign with your finger inside this box',
      checkbox_text: 'I have read, understood, and agree to all terms and conditions of this EVSMITH EV Scooter Rental Agreement.',
      submit_button_text: 'Submit & Lock Agreement',
    },
  },
  support: {
    page_key: 'support',
    title: '24/7 EVSMITH Helpline & Rider Support',
    subtitle: 'Dedicated roadside assistance, battery swap, and rental support in Hyderabad.',
    image_url: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
    content_data: {
      support_email: 'support@evsmith.com',
      support_phone: '+91 98765 43210',
      whatsapp_number: '+91 98765 43210',
      roadside_assistance: '1800 200 4567',
      operating_hours: '24/7 (Mon - Sun)',
      hub_address: 'HITEC City Main Hub, Cyber Towers, Madhapur, Hyderabad, TS - 500081',
      emergency_notes: 'In case of breakdown, battery drain, or puncture, our roadside rescue squad arrives within 30 minutes.',
    },
  },
};

export const useAppContentStore = create<AppContentState>()(
  persist(
    (set, get) => ({
      pages: DEFAULT_PAGE_CONTENT,
      isLoading: false,

      fetchContent: async () => {
        try {
          set({ isLoading: true });
          const res = await apiClient.get('/content');
          if (res.data) {
            set({
              pages: {
                ...get().pages,
                ...res.data,
              },
            });
          }
        } catch (err) {
          console.log('Using cached app content (offline/fallback):', err);
        } finally {
          set({ isLoading: false });
        }
      },

  updatePageContent: async (pageKey: string, partial: Partial<PageContent>) => {
    try {
      // Optimistic update
      set((state) => {
        const current = state.pages[pageKey] || DEFAULT_PAGE_CONTENT[pageKey] || {
          page_key: pageKey,
          title: '',
          subtitle: '',
          image_url: '',
          content_data: {},
        };
        return {
          pages: {
            ...state.pages,
            [pageKey]: {
              ...current,
              ...partial,
              content_data: {
                ...(current.content_data || {}),
                ...(partial.content_data || {}),
              },
            },
          },
        };
      });

      // Persist to backend admin content
      const adminLogin = await apiClient.post('/auth/login', {
        identifier: 'admin@evsmith.com',
        password: 'Admin@EVSmith2026!',
      });
      const token = adminLogin.data.access_token;

      const pageToSave = get().pages[pageKey];
      await apiClient.put(`/admin/content/${pageKey}`, pageToSave, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.log('Error updating app content:', err);
      throw err;
    }
  },

  getContent: (pageKey, field, defaultVal) => {
    const page = get().pages[pageKey];
    if (page && page[field]) {
      return page[field] as string;
    }
    return defaultVal;
  },

  getDataField: (pageKey, fieldKey, defaultVal) => {
    const page = get().pages[pageKey];
    if (page && page.content_data && page.content_data[fieldKey] !== undefined) {
      return String(page.content_data[fieldKey]);
    }
    return defaultVal;
  },
}),
    {
      name: '@evsmith_app_content_v2',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ pages: state.pages }),
    }
  )
);
