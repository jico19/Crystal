import type { Organization } from '@crystal/types';

export const GEORGIA_ORGANIZATION: Organization = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'With Open Hands',
  state_code: 'GA',
  domain: 'withopenhands.com',
  license_number: 'GA-HCPR-049281',
  contact_phone: '(404) 555-0199',
  contact_email: 'care@withopenhands.com',
  emergency_phone: '(404) 555-0190',
  office_address: {
    street: '1000 Peachtree St NE, Suite 400',
    city: 'Atlanta',
    state: 'GA',
    zip: '30309',
  },
  office_hours: 'Mon-Fri 8:30 AM - 5:00 PM EST (24/7 On-Call Support)',
  branding_theme: {
    primary_color: '#0f766e', // Deep Teal
    secondary_color: '#134e4a',
    accent_color: '#d97706', // Gold / Amber
    logo_url: '/images/woh-logo.svg',
    favicon_url: '/favicon.ico',
    hero_headline: 'Compassionate In-Home Care for Georgia Families',
    hero_subheading:
      'With Open Hands provides state-licensed personal care, companion support, and skilled care tailored to your loved one in Atlanta and surrounding Georgia counties.',
  },
  enabled_services: [
    {
      slug: 'personal-care',
      title: 'Personal Care Support',
      description: 'Assistance with daily living activities, bathing, dressing, hygiene, and safe mobility.',
      icon_name: 'Heart',
    },
    {
      slug: 'companion-care',
      title: 'Companion & Social Care',
      description: 'Meaningful social engagement, meal preparation, medication reminders, and light housekeeping.',
      icon_name: 'Users',
    },
    {
      slug: 'respite-care',
      title: 'Family Respite Care',
      description: 'Providing dedicated relief and peace of mind for primary family caregivers.',
      icon_name: 'Clock',
    },
    {
      slug: 'skilled-nursing',
      title: 'Skilled Nursing Oversight',
      description: 'RN-directed care plans, vital sign monitoring, and chronic condition management in Georgia.',
      icon_name: 'Stethoscope',
    },
  ],
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
