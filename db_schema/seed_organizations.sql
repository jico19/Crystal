-- ============================================================================
-- Seed: seed_organizations.sql
-- Description: Inserts initial Organization tenant rows for GA (With Open Hands)
--              and IN (Cherish Open Arms).
-- ============================================================================

INSERT INTO public.organizations (
    id,
    name,
    state_code,
    primary_domain,
    subdomains,
    license_number,
    contact_phone,
    contact_email,
    emergency_phone,
    office_address,
    office_hours,
    branding_theme,
    enabled_services,
    is_active
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'With Open Hands',
    'GA',
    'withopenhands.com',
    ARRAY['ga.crystalhomecare.com', 'localhost'],
    'GA-DCH-987654',
    '(404) 555-0199',
    'info@withopenhands.com',
    '(404) 555-0911',
    '{"street": "100 Peachtree St NW, Suite 1500", "city": "Atlanta", "state": "GA", "zip": "30303"}'::jsonb,
    'Mon-Fri 8:30 AM - 5:00 PM EST',
    '{
        "primary_color": "#0F766E",
        "secondary_color": "#134E4A",
        "accent_color": "#F59E0B",
        "logo_url": "/assets/ga-logo.svg",
        "favicon_url": "/assets/ga-favicon.ico",
        "hero_headline": "Compassionate Home Care Across Georgia",
        "hero_subheading": "Dedicated personal support and skilled caregiving services in Atlanta and surrounding counties."
    }'::jsonb,
    '[
        {"slug": "personal-care", "title": "Personal Support Services", "description": "Hands-on assistance with bathing, dressing, grooming, and mobility.", "icon_name": "HeartHandshake"},
        {"slug": "companion-care", "title": "Companion & Respite Care", "description": "Friendly companionship, meal preparation, and relief for family caregivers.", "icon_name": "UserCheck"}
    ]'::jsonb,
    true
), (
    'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    'Cherish Open Arms',
    'IN',
    'cherishopenarms.com',
    ARRAY['in.crystalhomecare.com'],
    'IN-FSSA-123456',
    '(317) 555-0288',
    'info@cherishopenarms.com',
    '(317) 555-0911',
    '{"street": "200 S Meridian St, Suite 400", "city": "Indianapolis", "state": "IN", "zip": "46225"}'::jsonb,
    'Mon-Fri 8:30 AM - 5:00 PM EST',
    '{
        "primary_color": "#1E3A8A",
        "secondary_color": "#1E1B4B",
        "accent_color": "#F97316",
        "logo_url": "/assets/in-logo.svg",
        "favicon_url": "/assets/in-favicon.ico",
        "hero_headline": "Trusted Home Care Across Indiana",
        "hero_subheading": "Empowering seniors and individuals with disabilities to live independently with dignity."
    }'::jsonb,
    '[
        {"slug": "attendant-care", "title": "Attendant Care Services", "description": "Structured assistance with daily living activities under Indiana Medicaid Waiver.", "icon_name": "ShieldCheck"},
        {"slug": "homemaker", "title": "Homemaker Services", "description": "Light housekeeping, laundry, running errands, and prescription pickup.", "icon_name": "Home"}
    ]'::jsonb,
    true
)
ON CONFLICT (state_code) DO UPDATE SET
    name = EXCLUDED.name,
    primary_domain = EXCLUDED.primary_domain,
    license_number = EXCLUDED.license_number,
    contact_phone = EXCLUDED.contact_phone,
    contact_email = EXCLUDED.contact_email,
    office_address = EXCLUDED.office_address,
    branding_theme = EXCLUDED.branding_theme,
    enabled_services = EXCLUDED.enabled_services;
