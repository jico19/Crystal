-- ============================================================================
-- Migration 011: Seed Florida Organization Tenant (Scope 1)
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
    'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    'Sun Coast Care',
    'FL',
    'suncoastcare.com',
    ARRAY['fl.crystalhomecare.com'],
    'FL-AHCA-3024881',
    '(305) 555-0377',
    'info@suncoastcare.com',
    '(305) 555-0911',
    '{"street": "701 Brickell Ave, Suite 1550", "city": "Miami", "state": "FL", "zip": "33131"}'::jsonb,
    'Mon-Fri 8:30 AM - 5:00 PM EST',
    '{
        "primary_color": "#0D9488",
        "secondary_color": "#115E59",
        "accent_color": "#EAB308",
        "logo_url": "/assets/fl-logo.svg",
        "favicon_url": "/assets/fl-favicon.ico",
        "hero_headline": "Sunshine State Compassionate In-Home Care",
        "hero_subheading": "Dedicated direct care and nurse-supervised support for seniors and families across South Florida."
    }'::jsonb,
    '[
        {"slug": "personal-care", "title": "Personal Care Services", "description": "Hands-on assistance with activities of daily living under Florida AHCA standards.", "icon_name": "HeartHandshake"},
        {"slug": "respite-care", "title": "Family Respite Support", "description": "Temporary relief and dedicated companionship for primary family caregivers.", "icon_name": "UserCheck"},
        {"slug": "homemaker", "title": "Homemaker & Companionship", "description": "Meal preparation, light housekeeping, and medication reminders.", "icon_name": "Home"}
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
