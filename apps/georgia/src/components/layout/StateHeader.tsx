import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Phone, Menu, X, Globe, HeartHandshake } from 'lucide-react';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';

export const StateHeader: React.FC = () => {
  const { org } = useOrgTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (!org) return null;

  const isGA = org.state_code === 'GA';
  const alternateStateName = isGA ? 'Cherish Open Arms (Indiana)' : 'With Open Hands (Georgia)';
  const alternateDomain = isGA ? 'https://cherishopenarms.com' : 'https://withopenhands.com';

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'About Us', path: '/about' },
    { label: 'Careers', path: '/apply', badge: 'Hiring' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      {/* Top Utility Bar */}
      <div className="bg-slate-950 px-4 py-1.5 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center space-x-4">
            <span className="text-slate-400">
              License #: <span className="text-slate-200 font-medium">{org.license_number}</span>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span className="hidden sm:inline text-slate-400">
              Hours: <span className="text-slate-200">{org.office_hours}</span>
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Cross-State Domain Switcher Link */}
            <a
              href={`${alternateDomain}${location.pathname}`}
              className="inline-flex items-center space-x-1.5 text-slate-400 hover:text-teal-400 transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Looking for {alternateStateName}?</span>
            </a>

            <a
              href={`tel:${org.contact_phone}`}
              className="inline-flex items-center space-x-1 font-semibold text-teal-400 hover:underline"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{org.contact_phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Header Nav Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center space-x-3 group">
          {org.branding_theme?.logo_url ? (
            <img src={org.branding_theme.logo_url} alt={org.name} className="h-9 w-auto" />
          ) : (
            <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 group-hover:bg-teal-500/30 transition-colors">
              <HeartHandshake className="w-6 h-6" />
            </div>
          )}
          <div>
            <span className="font-bold text-lg text-white block leading-tight tracking-tight">
              {org.name}
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              {org.state_code === 'GA' ? 'Georgia Home Care' : 'Indiana Home Care'}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <nav className="hidden md:flex items-center space-x-7">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors flex items-center space-x-1.5 ${
                  isActive ? 'text-teal-400 font-semibold' : 'text-slate-300 hover:text-white'
                }`
              }
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Action Button & Mobile Toggle */}
        <div className="flex items-center space-x-3">
          <Link
            to="/auth/login"
            style={{ backgroundColor: 'var(--primary, #0F766E)' }}
            className="hidden sm:inline-flex items-center px-4 py-2 rounded text-xs font-semibold uppercase tracking-wider text-white hover:brightness-110 transition-all shadow-md cursor-pointer"
          >
            Portal Login
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 pt-3 pb-6 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between text-base font-medium py-2 ${
                  isActive ? 'text-teal-400 font-semibold' : 'text-slate-300'
                }`
              }
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-2 py-0.5 rounded text-xs bg-teal-500/20 text-teal-300 font-semibold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
          <Link
            to="/auth/login"
            onClick={() => setMobileMenuOpen(false)}
            style={{ backgroundColor: 'var(--primary, #0F766E)' }}
            className="block text-center w-full py-2.5 rounded text-sm font-semibold uppercase tracking-wider text-white"
          >
            Portal Login
          </Link>
        </div>
      )}
    </header>
  );
};
