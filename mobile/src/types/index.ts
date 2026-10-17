export interface User {
  id: number;
  email: string;
  phone: string;
  role: 'RIDER' | 'SUPER_ADMIN';
  must_change_password: boolean;
  is_profile_complete: boolean;
  full_name?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface Address {
  address_type: string;
  line: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  is_same_as_current?: boolean;
}

export interface DocumentInfo {
  id: number;
  document_type: 'AADHAAR' | 'PAN' | 'DRIVING_LICENCE';
  document_number: string;
  secure_url: string;
  verification_status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
  uploaded_at: string;
}

export interface EmergencyContact {
  reference_name: string;
  reference_phone: string;
  emergency_name: string;
  emergency_phone: string;
}

export interface RiderProfile {
  user_id: number;
  email: string;
  phone: string;
  role: string;
  full_name?: string;
  dob?: string;
  gender?: string;
  occupation?: string;
  employer_id?: string;
  alt_phone?: string;
  is_profile_complete: boolean;
  addresses: Address[];
  documents: DocumentInfo[];
  emergency_contact?: EmergencyContact;
  declaration_agreed: boolean;
}

export interface Station {
  id: number;
  name: string;
  code: string;
  address: string;
  city: string;
  latitude?: number;
  longitude?: number;
  contact_number?: string;
  is_active: boolean;
}

export interface Vehicle {
  id: number;
  station_id: number;
  station_name?: string;
  make: string;
  model: string;
  variant: string;
  registration_number: string;
  chassis_number: string;
  battery_percentage: number;
  range_km: number;
  top_speed_kmh: number;
  daily_rate: number;
  deposit_amount: number;
  status: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RESERVED';
  image_url: string;
  features?: string;
  station?: Station;
}

export type BookingStatus =
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'AGREEMENT_REQUIRED'
  | 'HANDOVER_REQUIRED'
  | 'ACTIVE'
  | 'EXTENSION_REQUESTED'
  | 'VEHICLE_CHANGE_REQUESTED'
  | 'RETURN_PENDING'
  | 'SETTLEMENT_PENDING'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED';

export interface BookingStatusHistoryItem {
  id: number;
  old_status?: string;
  new_status: string;
  remarks?: string;
  created_at: string;
}

export interface RentalAgreement {
  id: number;
  lessor_name: string;
  lessor_address: string;
  lessee_name: string;
  lessee_phone: string;
  lessee_dob?: string;
  lessee_address: string;
  terms_version: string;
  signed_at: string;
  is_locked: boolean;
}

export interface VehicleHandover {
  id: number;
  tyres_condition: 'GOOD' | 'DAMAGED';
  brakes_condition: 'GOOD' | 'DAMAGED';
  electricals_condition: 'WORKING' | 'NOT_WORKING';
  battery_percentage_at_handover: number;
  has_helmet: boolean;
  has_charger: boolean;
  has_toolbox: boolean;
  inspector_notes?: string;
  handover_timestamp: string;
}

export interface BookingExtension {
  id: number;
  requested_days: number;
  additional_amount: number;
  reason?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  admin_notes?: string;
  created_at: string;
}

export interface FinalSettlement {
  id: number;
  base_rental_amount: number;
  extension_amount: number;
  damage_charges: number;
  damage_notes?: string;
  late_days: number;
  late_charges: number;
  other_charges: number;
  security_deposit_held: number;
  refund_amount: number;
  net_payable_amount: number;
  rider_acknowledged: boolean;
  acknowledged_at?: string;
  closed_at?: string;
}

export interface Booking {
  id: number;
  booking_number: string;
  rider_id: number;
  vehicle_id: number;
  station_id: number;
  status: BookingStatus;
  start_date: string;
  end_date: string;
  duration_days: number;
  daily_rate: number;
  rental_amount: number;
  deposit_amount: number;
  total_amount: number;
  created_at: string;
  approved_at?: string;
  vehicle?: Vehicle;
  station?: Station;
  rider?: {
    id: number;
    email: string;
    phone: string;
    full_name?: string;
    dob?: string;
    is_profile_complete: boolean;
    verification_status?: string;
  };
  status_history?: BookingStatusHistoryItem[];
  agreement?: RentalAgreement;
  handover?: VehicleHandover;
  extensions?: BookingExtension[];
  settlement?: FinalSettlement;
}
