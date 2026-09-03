import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield, HeartHandshake } from 'lucide-react';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';

export const StateFooter: React.FC = () => {
  const { org } = useOrgTheme();
  if (!org) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Column 1: Organization Branding & State License */}
        <div className="space-y-4 md:col-span-1">
          <div className="flex items-center space-x-3">
            {org.branding_theme?.logo_url ? (
              <img src={org.branding_theme.logo_url} alt={org.name} className="h-8 w-auto" />
            ) : (
              <div className="p-2 rounded bg-teal-500/20 text-teal-400">
                <HeartHandshake className="w-5 h-5" />
              </div>
            )}
            <span className="font-bold text-base text-white tracking-tight">{org.name}</span>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            {org.branding_theme?.hero_subheading ||
              'Providing compassionate, high-quality in-home personal care and companion services in Georgia.'}
          </p>

          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>State License #: <strong className="text-white">{org.license_number}</strong></span>
          </div>
        </div>

        {/* Column 2: Services Offered */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Our Services</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/services#personal-care" className="hover:text-teal-400">Personal Support Services</Link></li>
            <li><Link to="/services#companion-care" className="hover:text-teal-400">Companion & Homemaker</Link></li>
            <li><Link to="/services#dementia-care" className="hover:text-teal-400">Dementia & Alzheimer’s Care</Link></li>
            <li><Link to="/services#respite-care" className="hover:text-teal-400">Family Caregiver Respite</Link></li>
          </ul>
        </div>

        {/* Column 3: Quick Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Quick Links</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/" className="hover:text-teal-400 transition-colors">Home</Link></li>
            <li><Link to="/services" className="hover:text-teal-400 transition-colors">All Services</Link></li>
            <li><Link to="/about" className="hover:text-teal-400 transition-colors">About Our Agency</Link></li>
            <li><Link to="/apply" className="hover:text-teal-400 transition-colors font-semibold text-teal-300">Caregiver Careers (Apply Online)</Link></li>
            <li><Link to="/contact" className="hover:text-teal-400 transition-colors">Contact & Free Assessment</Link></li>
            <li><Link to="/auth/login" className="hover:text-teal-400 transition-colors">Caregiver & Client Portal</Link></li>
          </ul>
        </div>

        {/* Column 4: Physical Office & Contact */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">Georgia Office</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start space-x-2">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>
                {org.office_address?.street}, {org.office_address?.city}, {org.office_address?.state} {org.office_address?.zip}
              </span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-teal-400 shrink-0" />
              <a href={`tel:${org.contact_phone}`} className="hover:underline text-slate-200 font-medium">
                {org.contact_phone}
              </a>
            </li>
            <li className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-teal-400 shrink-0" />
              <a href={`mailto:${org.contact_email}`} className="hover:underline">
                {org.contact_email}
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright Bar */}
      <div className="border-t border-slate-900 bg-black/40 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
          <p>© {currentYear} {org.name}. Licensed Georgia Home Care Provider.</p>
          <div className="flex space-x-4">
            <Link to="/contact" className="hover:underline">Privacy Policy</Link>
            <Link to="/contact" className="hover:underline">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
