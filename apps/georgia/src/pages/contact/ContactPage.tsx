import React from 'react';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import { ContactForm } from '../../components/forms/ContactForm.tsx';
import {
  MapPin,
  PhoneCall,
  Clock,
  Mail,
  ShieldCheck,
  Building,
} from 'lucide-react';

export const ContactPage: React.FC = () => {
  const { org } = useOrgTheme();

  return (
    <div className="space-y-12 py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Georgia Office & Care Coordination</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Contact Our Georgia Care Team
        </h1>
        <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
          Whether you need immediate care assistance, have questions regarding Georgia Medicaid waivers, or are inquiring about career opportunities, we&apos;re here to help.
        </p>
      </div>

      {/* Main Grid: Info + Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Building className="w-5 h-5 text-teal-400" />
              <span>Office Location & Hours</span>
            </h2>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="flex items-start space-x-3">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Main Office</strong>
                  <span>{org?.office_address?.street || '100 Peachtree St NW, Suite 1500'}</span>
                  <br />
                  <span>{org?.office_address?.city || 'Atlanta'}, {org?.office_address?.state || 'GA'} {org?.office_address?.zip || '30303'}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <PhoneCall className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">General Inquiries & Intake</strong>
                  <a href={`tel:${org?.contact_phone || '(404) 555-0199'}`} className="hover:text-teal-400 transition-colors">
                    {org?.contact_phone || '(404) 555-0199'}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Mail className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Email Us</strong>
                  <a href={`mailto:${org?.contact_email || 'info@withopenhands.com'}`} className="hover:text-teal-400 transition-colors">
                    {org?.contact_email || 'info@withopenhands.com'}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Clock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Office Hours</strong>
                  <span>{org?.office_hours || 'Mon-Fri 8:30 AM - 5:00 PM EST'}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-3 border-t border-slate-800">
                <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">24/7 Urgent Client Hotline</strong>
                  <span className="text-teal-300 font-semibold">{org?.emergency_phone || '(404) 555-0911'}</span>
                  <span className="text-slate-500 block text-[11px] mt-0.5">Available for active clients & on-duty caregivers</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-1">Send a Message</h2>
          <p className="text-xs text-slate-400 mb-6">
            Fill out the form below to request a callback, schedule an in-home assessment, or ask general questions.
          </p>
          <ContactForm />
        </div>
      </div>
    </div>
  );
};
