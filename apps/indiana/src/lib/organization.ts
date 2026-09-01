import type { Organization } from '@crystal/types';

export const INDIANA_ORGANIZATION: Organization = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Cherish Open Arms',
  state_code: 'IN',
  domain: 'cherishopenarms.com',
  license_number: 'IN-FSSA-982104',
  contact_phone: '(317) 555-0144',
  contact_email: 'care@cherishopenarms.com',
  emergency_phone: '(317) 555-0140',
  office_address: {
    street: '201 N Illinois St, 16th Floor',
    city: 'Indianapolis',
    state: 'IN',
    zip: '46204',
  },
  office_hours: 'Mon-Fri 8:30 AM - 5:00 PM EST (24/7 On-Call Support)',
  branding_theme: {
    primary_color: '#1e3a8a', // Deep Navy
    secondary_color: '#1e293b',
    accent_color: '#f43f5e', // Coral / Rose
    logo_url: '/images/coa-logo.svg',
    favicon_url: '/favicon.ico',
    hero_headline: 'Trusted In-Home Care & Support Across Indiana',
    hero_subheading:
      'Cherish Open Arms is dedicated to providing high-quality personal care, companionship, and respite services for seniors and individuals with disabilities across Indianapolis and Indiana.',
  },
  enabled_services: [
    {
      slug: 'personal-care',
      title: 'Attendant & Personal Care',
      description: 'Hands-on assistance with hygiene, bathing, dressing, meal planning, and mobility support.',
      icon_name: 'Heart',
    },
    {
      slug: 'companion-care',
      title: 'Companion Care Services',
      description: 'Engaging socialization, errands, housekeeping, and safety supervision throughout Indiana.',
      icon_name: 'Users',
    },
    {
      slug: 'respite-care',
      title: 'Respite Care Support',
      description: 'Short-term and scheduled respite care providing dedicated relief for family caregivers.',
      icon_name: 'Clock',
    },
    {
      slug: 'structured-family-care',
      title: 'Structured Family Caregiving',
      description: 'Support and coaching for eligible family caregivers under Indiana Medicaid waiver programs.',
      icon_name: 'Home',
    },
  ],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
