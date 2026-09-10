import React from 'react';
import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  HeartHandshake,
  ShieldCheck,
  Lock,
  Clock,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';

export const StateFooter: React.FC = () => {
  const { org } = useOrgTheme();
  if (!org) return null;

  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 text-sm">
      {/* Top Trust & Accreditation Strip */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center sm:text-left">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">HIPAA Compliant</div>
              <div className="text-[11px] text-slate-400">256-bit encrypted data vault</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">State Licensed</div>
              <div className="text-[11px] text-slate-400">DCH License #{org.license_number}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Medicaid Certified</div>
              <div className="text-[11px] text-slate-400">CCSP & SOURCE Approved</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Bonded & Insured</div>
              <div className="text-[11px] text-slate-400">FBI / State Background Checked</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Information */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {/* Column 1: Organization Branding & Mission */}
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">{org.name}</span>
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-wider">
                Georgia Home Care Division
              </span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-slate-400">
            Dedicated to providing dignified, person-centered in-home care support across Georgia. Empowering seniors and individuals with physical disabilities to live independently with dignity.
          </p>

          {/* 24/7 Dispatch Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-[11px] font-bold text-teal-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>24/7 Clinical Dispatch</span>
            </div>
            <a
              href={`tel:${org.contact_phone}`}
              className="text-base font-bold text-white hover:text-teal-300 transition-colors block"
            >
              {org.contact_phone}
            </a>
            <div className="text-[10px] text-slate-400">Always answered by a live care coordinator</div>
          </div>
        </div>

        {/* Column 2: In-Home Care Services */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800/80 pb-2">
            In-Home Care Services
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/services#personal-care" className="hover:text-teal-400 transition-colors flex items-center justify-between group">
                <span>Personal Support Services (PSS)</span>
                <span className="text-slate-600 group-hover:text-teal-400 transition-colors">&rarr;</span>
              </Link>
            </li>
            <li>
              <Link to="/services#companion-care" className="hover:text-teal-400 transition-colors flex items-center justify-between group">
                <span>Companion & Homemaker Care</span>
                <span className="text-slate-600 group-hover:text-teal-400 transition-colors">&rarr;</span>
              </Link>
            </li>
            <li>
              <Link to="/services#dementia-care" className="hover:text-teal-400 transition-colors flex items-center justify-between group">
                <span>Alzheimer’s & Dementia Support</span>
                <span className="text-slate-600 group-hover:text-teal-400 transition-colors">&rarr;</span>
              </Link>
            </li>
            <li>
              <Link to="/services#respite-care" className="hover:text-teal-400 transition-colors flex items-center justify-between group">
                <span>Family Caregiver Respite Relief</span>
                <span className="text-slate-600 group-hover:text-teal-400 transition-colors">&rarr;</span>
              </Link>
            </li>
            <li>
              <Link to="/services#mobility-support" className="hover:text-teal-400 transition-colors flex items-center justify-between group">
                <span>Mobility & Transfer Assistance</span>
                <span className="text-slate-600 group-hover:text-teal-400 transition-colors">&rarr;</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Secured Portals & Careers */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800/80 pb-2">
            Portals & Careers
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li>
              <Link to="/login" className="hover:text-teal-400 transition-colors flex items-center gap-1.5 font-medium text-slate-300">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
                <span>Secured Care Portal Login</span>
              </Link>
            </li>
            <li>
              <Link to="/apply" className="inline-flex items-center gap-1 text-teal-400 hover:text-teal-300 font-bold transition-colors">
                <span>Caregiver Careers & Online Application &rarr;</span>
              </Link>
            </li>
            <li className="pt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/60">
              Single unified sign-in for caregivers, client families, clinical coordinators, and agency staff.
            </li>
          </ul>
        </div>

        {/* Column 4: Physical Office & Regional Contact */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-white border-b border-slate-800/80 pb-2">
            Georgia Regional Office
          </h4>
          <ul className="space-y-2.5 text-xs">
            <li className="flex items-start space-x-2.5">
              <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span>
                {org.office_address?.street}, Suite 200<br />
                {org.office_address?.city}, {org.office_address?.state} {org.office_address?.zip}
              </span>
            </li>
            <li className="flex items-center space-x-2.5">
              <Phone className="w-4 h-4 text-teal-400 shrink-0" />
              <a href={`tel:${org.contact_phone}`} className="hover:underline text-slate-200 font-medium">
                {org.contact_phone}
              </a>
            </li>
            <li className="flex items-center space-x-2.5">
              <Mail className="w-4 h-4 text-teal-400 shrink-0" />
              <a href={`mailto:${org.contact_email}`} className="hover:underline text-slate-300">
                {org.contact_email}
              </a>
            </li>
            <li className="flex items-center space-x-2.5 text-slate-400">
              <Clock className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{org.office_hours}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Legal & Regulatory Compliance Bar */}
      <div className="border-t border-slate-800/80 bg-black/60 py-5 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          <div>
            <p>© {currentYear} {org.name}. Licensed Georgia Private Home Care Provider.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Protected Health Information (PHI) encrypted and safeguarded under HIPAA Security Rule (45 CFR § 164.312).
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-400">
            <Link to="/contact" className="hover:text-teal-400 transition-colors">Notice of Privacy Practices</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-teal-400 transition-colors">Terms of Service</Link>
            <span>•</span>
            <Link to="/contact" className="hover:text-teal-400 transition-colors">Non-Discrimination Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
