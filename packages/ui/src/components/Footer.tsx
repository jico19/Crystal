import * as React from 'react';
import type { Organization } from '@crystal/types';
import { ShieldCheck, Phone, Mail, MapPin, HeartHandshake } from 'lucide-react';

export interface FooterProps {
  organization: Organization;
}

export function Footer({ organization }: FooterProps) {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-16 pb-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-gray-800">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="text-xl font-extrabold tracking-tight">{organization.name}</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Providing compassionate, licensed in-home care services tailored to your loved one’s unique health and personal needs.
            </p>
            <div className="flex items-center gap-2 text-xs text-accent font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>State License: {organization.license_number}</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase">Agency</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="/services" className="hover:text-white transition-colors">Services</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Our Team</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact Us</a></li>
              <li><a href="/contact?type=caregiver_inquiry" className="hover:text-white transition-colors">Caregiver Careers</a></li>
            </ul>
          </div>

          {/* Core Services */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase">Services</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/services#personal-care" className="hover:text-white transition-colors">Personal Care Support</a></li>
              <li><a href="/services#companion-care" className="hover:text-white transition-colors">Companion Care</a></li>
              <li><a href="/services#respite-care" className="hover:text-white transition-colors">Respite Care for Families</a></li>
              <li><a href="/services#skilled-nursing" className="hover:text-white transition-colors">Skilled Nursing & Health</a></li>
            </ul>
          </div>

          {/* Office & Contact */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold tracking-wider text-white uppercase">Local Office</h4>
            <div className="space-y-3 text-sm text-gray-400">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  {organization.office_address.street}<br />
                  {organization.office_address.city}, {organization.office_address.state} {organization.office_address.zip}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href={`tel:${organization.contact_phone}`} className="hover:text-white transition-colors">
                  {organization.contact_phone}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <a href={`mailto:${organization.contact_email}`} className="hover:text-white transition-colors">
                  {organization.contact_email}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Legal & Compliance Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} {organization.name}. All rights reserved. Licensed in {organization.state_code}.</p>
          <div className="flex items-center space-x-6">
            <span>HIPAA-Ready Platform</span>
            <span>Equal Opportunity Employer</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
