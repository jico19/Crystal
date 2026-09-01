'use client';

import * as React from 'react';
import type { Organization } from '@crystal/types';
import { Phone, ShieldCheck, HeartHandshake, Menu, X } from 'lucide-react';
import { Button } from './Button';

export interface NavbarProps {
  organization: Organization;
}

export function Navbar({ organization }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur border-b border-gray-100 shadow-sm">
      {/* Top Banner */}
      <div className="bg-primary text-white py-1.5 px-4 text-xs font-medium">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              State Licensed Agency ({organization.state_code}): {organization.license_number}
            </span>
          </div>
          <div className="hidden sm:flex items-center space-x-4">
            <a
              href={`tel:${organization.contact_phone}`}
              className="flex items-center gap-1 hover:text-accent transition-colors font-semibold"
            >
              <Phone className="w-3.5 h-3.5" />
              {organization.contact_phone}
            </a>
            <span className="text-white/40">|</span>
            <span>{organization.office_hours}</span>
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Brand Logo */}
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900 block group-hover:text-primary transition-colors">
                {organization.name}
              </span>
              <span className="text-xs text-gray-500 font-medium block">
                Home Care Agency • {organization.office_address.city}, {organization.office_address.state}
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="/" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Home
            </a>
            <a href="/services" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Services
            </a>
            <a href="/about" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              About Us
            </a>
            <a href="/contact" className="text-sm font-medium text-gray-700 hover:text-primary transition-colors">
              Contact
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="hidden md:flex items-center space-x-3">
            <a href="/contact">
              <Button variant="primary" size="md">
                Request Care
              </Button>
            </a>
            <a href="/apply">
              <Button variant="outline" size="md">
                Join Our Team
              </Button>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-primary p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-3 pb-6 space-y-3">
          <a
            href="/"
            className="block py-2 text-base font-semibold text-gray-800 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Home
          </a>
          <a
            href="/services"
            className="block py-2 text-base font-semibold text-gray-800 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Services
          </a>
          <a
            href="/about"
            className="block py-2 text-base font-semibold text-gray-800 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            About Us
          </a>
          <a
            href="/contact"
            className="block py-2 text-base font-semibold text-gray-800 hover:text-primary"
            onClick={() => setMobileMenuOpen(false)}
          >
            Contact
          </a>
          <div className="pt-3 flex flex-col gap-2">
            <a href="/contact" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" className="w-full">
                Request Care
              </Button>
            </a>
            <a href="/apply" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full">
                Join Our Team
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
