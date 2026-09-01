export type StateCode = 'GA' | 'IN' | 'FL';

export interface OfficeAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

export interface BrandingTheme {
  primary_color: string;
  secondary_color: string;
  accent_color: string;
  logo_url: string;
  favicon_url: string;
  hero_headline: string;
  hero_subheading: string;
}

export interface EnabledService {
  slug: string;
  title: string;
  description: string;
  icon_name: string;
}

export interface Organization {
  id: string;
  name: string;
  state_code: StateCode;
  domain: string;
  license_number: string;
  contact_phone: string;
  contact_email: string;
  emergency_phone?: string;
  office_address: OfficeAddress;
  office_hours: string;
  branding_theme: BrandingTheme;
  enabled_services: EnabledService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type InquiryType = 'caregiver_inquiry' | 'client_care_inquiry' | 'general_question';
export type InquiryStatus = 'new' | 'contacted' | 'converted' | 'archived';

export interface PublicInquiry {
  id: string;
  org_id: string;
  state_code: StateCode;
  full_name: string;
  email: string;
  phone: string;
  inquiry_type: InquiryType;
  message: string;
  source_url: string;
  ip_address?: string;
  status: InquiryStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type UserRole =
  | 'super_admin'
  | 'state_admin'
  | 'agency_staff'
  | 'training_admin'
  | 'caregiver'
  | 'client';

export interface UserProfile {
  id: string;
  org_id?: string;
  role: UserRole;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: 'pending' | 'active' | 'suspended' | 'archived';
  mfa_enabled: boolean;
  created_at: string;
}
