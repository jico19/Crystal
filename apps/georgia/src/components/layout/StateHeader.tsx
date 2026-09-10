import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Phone,
  Menu,
  X,
  Globe,
  HeartHandshake,
  ChevronDown,
  ShieldCheck,
  Lock,
  Sparkles,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import { getCurrentUser, getDesignatedRoute, getAllowedPortals } from '../../lib/auth-helpers.ts';

export const StateHeader: React.FC = () => {
  const { org } = useOrgTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState(false);
  const [portalDropdownOpen, setPortalDropdownOpen] = useState(false);
  const location = useLocation();

  const stateMenuRef = useRef<HTMLDivElement>(null);
  const portalMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (stateMenuRef.current && !stateMenuRef.current.contains(event.target as Node)) {
        setStateDropdownOpen(false);
      }
      if (portalMenuRef.current && !portalMenuRef.current.contains(event.target as Node)) {
        setPortalDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!org) return null;

  const ALL_STATES = [
    {
      code: 'GA',
      name: 'Georgia',
      agency: 'With Open Hands',
      domain: 'https://withopenhands.com',
      badge: 'CCSP & SOURCE Approved',
      city: 'Norcross & Metro Atlanta',
    },
    {
      code: 'IN',
      name: 'Indiana',
      agency: 'Cherish Open Arms',
      domain: 'https://cherishopenarms.com',
      badge: 'FSSA Pathways Provider',
      city: 'Indianapolis & Marion Co.',
    },
    {
      code: 'FL',
      name: 'Florida',
      agency: 'Sun Coast Care',
      domain: 'https://suncoastcare.com',
      badge: 'AHCA Licensed Home Care',
      city: 'Miami & South Florida',
    },
  ];

  const currentState = ALL_STATES.find((s) => s.code === org.state_code) || ALL_STATES[0];

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Services', path: '/services' },
    { label: 'About Us', path: '/about' },
    { label: 'Careers', path: '/apply', badge: 'Hiring' },
    { label: 'Contact', path: '/contact' },
  ];

  const currentUser = getCurrentUser();
  const allowedPortals = getAllowedPortals(currentUser?.role);
  const designatedRoute = getDesignatedRoute(currentUser?.role);

  return (
    <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 text-white transition-all shadow-lg">
      {/* Top Utility & Hotline Strip */}
      <div className="bg-slate-900/90 px-4 py-1.5 text-xs border-b border-slate-800/70">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Regulatory & Emergency Dispatch */}
          <div className="flex items-center space-x-3 text-slate-300">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[11px] font-medium">
              <ShieldCheck className="w-3 h-3" />
              State License: {org.license_number}
            </span>
            <span className="hidden lg:inline text-slate-600">|</span>
            <span className="hidden lg:inline text-slate-400 text-[11px]">
              Office Hours: <span className="text-slate-200">{org.office_hours}</span>
            </span>
          </div>

          {/* Right Controls: State Switcher & 24/7 Emergency Line */}
          <div className="flex items-center space-x-4">
            {/* Interactive Multi-State Dropdown */}
            <div className="relative" ref={stateMenuRef}>
              <button
                onClick={() => setStateDropdownOpen(!stateDropdownOpen)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                aria-expanded={stateDropdownOpen}
              >
                <Globe className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  State: <strong className="text-white">{currentState.code}</strong> ({currentState.name})
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {stateDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800/80">
                    Switch State Agency Website
                  </div>
                  {ALL_STATES.map((st) => {
                    const isCurrent = st.code === org.state_code;
                    return (
                      <a
                        key={st.code}
                        href={isCurrent ? '#' : `${st.domain}${location.pathname}`}
                        onClick={() => setStateDropdownOpen(false)}
                        className={`flex items-start justify-between p-2.5 rounded-lg text-xs transition-colors ${
                          isCurrent
                            ? 'bg-teal-500/10 text-teal-300 border border-teal-500/30'
                            : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] font-bold text-slate-300">
                              {st.code}
                            </span>
                            <span>{st.agency}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{st.city}</div>
                          <div className="text-[10px] text-teal-400/90 font-medium">{st.badge}</div>
                        </div>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-teal-400 px-1.5 py-0.5 rounded bg-teal-950 border border-teal-800">
                            Active
                          </span>
                        )}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 24/7 Urgent Dispatch Phone */}
            <a
              href={`tel:${org.contact_phone}`}
              className="inline-flex items-center gap-1.5 font-semibold text-teal-400 hover:text-teal-300 text-xs transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
              </span>
              <Phone className="w-3.5 h-3.5" />
              <span>24/7 Care: {org.contact_phone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* Brand Logo & State Identity */}
        <Link to="/" className="flex items-center space-x-3.5 group">
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500/20 to-teal-600/10 text-teal-400 border border-teal-500/30 group-hover:border-teal-400 transition-all shadow-sm">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white block leading-tight tracking-tight group-hover:text-teal-300 transition-colors">
                {org.name}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                {org.state_code}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 tracking-wide block mt-0.5">
              Licensed In-Home Healthcare Platform
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center space-x-7">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `text-sm font-medium transition-all flex items-center space-x-1.5 py-1 ${
                  isActive
                    ? 'text-teal-400 font-semibold border-b-2 border-teal-400'
                    : 'text-slate-300 hover:text-white'
                }`
              }
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Action Controls & Portals Dropdown */}
        <div className="flex items-center space-x-3">
          {/* Portals Access Control: Direct login if guest, user dropdown if authenticated */}
          {!currentUser ? (
            <Link
              to="/login"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700/80 shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
            >
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              <span>Portal Login</span>
            </Link>
          ) : (
            <div className="relative hidden sm:block" ref={portalMenuRef}>
              <button
                onClick={() => setPortalDropdownOpen(!portalDropdownOpen)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-medium border border-teal-500/40 shadow-sm transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400"
                aria-expanded={portalDropdownOpen}
              >
                <div className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 font-bold flex items-center justify-center text-[10px] uppercase border border-teal-500/30">
                  {currentUser.email?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <span className="block text-[11px] font-semibold text-white truncate max-w-[120px]">
                    {currentUser.email}
                  </span>
                  <span className="block text-[9px] text-teal-400 font-bold uppercase tracking-wider">
                    {currentUser.role?.replace('_', ' ')}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {portalDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2.5 z-50 space-y-2">
                  <div className="px-3 py-2 border-b border-slate-800/80">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Signed in as</span>
                    <span className="text-xs font-semibold text-white block truncate">{currentUser.email}</span>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase">
                      {currentUser.role?.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <Link
                      to={designatedRoute}
                      onClick={() => setPortalDropdownOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs font-semibold text-teal-300 hover:bg-teal-500/20 transition-colors"
                    >
                      <span>My Primary Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {allowedPortals.filter((p) => p.path !== designatedRoute).length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-1">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 block">
                        Switch Portal
                      </span>
                      {allowedPortals
                        .filter((p) => p.path !== designatedRoute)
                        .map((p) => (
                          <Link
                            key={p.path}
                            to={p.path}
                            onClick={() => setPortalDropdownOpen(false)}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
                          >
                            <span>{p.label}</span>
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                          </Link>
                        ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80">
                    <button
                      onClick={() => {
                        localStorage.removeItem('crystal_jwt');
                        localStorage.removeItem('crystal_user');
                        setPortalDropdownOpen(false);
                        window.location.href = '/login';
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Primary Action Button */}
          <Link
            to="/contact"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide text-white bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-500 hover:to-teal-600 transition-all shadow-md shadow-teal-900/30 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Request Care</span>
          </Link>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 pt-4 pb-8 space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between text-sm font-semibold px-3 py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-teal-500/10 text-teal-400 border border-teal-500/30'
                      : 'text-slate-200 hover:bg-slate-900'
                  }`
                }
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-teal-500/20 text-teal-300 font-bold">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          {/* Mobile Portals Direct Access */}
          {currentUser ? (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  My Portal Access
                </span>
                <span className="text-[10px] text-teal-400 font-bold uppercase">
                  {currentUser.role?.replace('_', ' ')}
                </span>
              </div>
              <Link
                to={designatedRoute}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs font-semibold text-teal-300"
              >
                <span>My Primary Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {allowedPortals
                .filter((p) => p.path !== designatedRoute)
                .map((p) => (
                  <Link
                    key={p.path}
                    to={p.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300"
                  >
                    <span>{p.label}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </Link>
                ))}
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white"
              >
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                <span>Portal Login / Sign In</span>
              </Link>
            </div>
          )}

          <div className="pt-2 space-y-2">
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center w-full py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-700 text-sm font-semibold text-white shadow-lg"
            >
              Request Free In-Home Assessment
            </Link>
            {currentUser && (
              <button
                onClick={() => {
                  localStorage.removeItem('crystal_jwt');
                  localStorage.removeItem('crystal_user');
                  setMobileMenuOpen(false);
                  window.location.href = '/login';
                }}
                className="block text-center w-full py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-semibold text-red-400 cursor-pointer"
              >
                Sign Out ({currentUser.email})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
