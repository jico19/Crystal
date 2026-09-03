// ============================================================================
// @crystal/types — Shared Types & API Models
// ============================================================================

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
  state_code: 'GA' | 'IN' | 'FL';
  primary_domain: string;
  subdomains: string[];
  license_number: string;
  contact_phone: string;
  contact_email: string;
  emergency_phone?: string | null;
  office_address: OfficeAddress;
  office_hours: string;
  branding_theme: BrandingTheme;
  enabled_services: EnabledService[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
