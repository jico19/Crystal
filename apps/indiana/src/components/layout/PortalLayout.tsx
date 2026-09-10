import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  HeartHandshake,
  ShieldCheck,
  LogOut,
  ExternalLink,
  UserCheck,
  CalendarClock,
  Users,
  LayoutDashboard,
  ShieldAlert,
  Menu,
  X,
  Phone,
} from 'lucide-react';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';

interface PortalLayoutProps {
  children?: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({ children }) => {
  const { org } = useOrgTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobilePortalOpen, setMobilePortalOpen] = useState(false);

  if (!org) return null;

  const userStr = typeof window !== 'undefined' ? localStorage.getItem('crystal_user') : null;
  let user: { id?: string; email?: string; role?: string } | null = null;
  if (userStr) {
    try {
      user = JSON.parse(userStr);
    } catch {
      user = null;
    }
  }

  const allNavItems = [
    {
      label: 'Caregiver Portal',
      path: '/caregiver/portal',
      icon: UserCheck,
      desc: 'Credentials, in-service modules & packets',
      roles: ['super_admin', 'agency_admin', 'caregiver', 'registered_nurse'],
    },
    {
      label: 'Client Self-Service',
      path: '/portal/client',
      icon: CalendarClock,
      desc: 'Care plans, schedules & authorizations',
      roles: ['super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse', 'caregiver'],
    },
    {
      label: 'Staff Client Operations',
      path: '/clients',
      icon: Users,
      desc: 'Intake, 15-min burndown & clinical docs',
      roles: ['super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse'],
    },
    {
      label: 'Admin Command Center',
      path: '/admin',
      icon: LayoutDashboard,
      desc: 'Multi-state KPIs, reports & survey audits',
      roles: ['super_admin', 'agency_admin'],
    },
    {
      label: 'Security & RBAC',
      path: '/admin/settings/rbac',
      icon: ShieldAlert,
      desc: 'Role permissions & tamper-evident audit logs',
      roles: ['super_admin', 'agency_admin'],
    },
  ];

  const portalNav = user
    ? allNavItems.filter((item) => item.roles.includes(user.role || ''))
    : allNavItems.filter((item) => item.path === '/portal/client' || item.path === '/caregiver/portal');

  const handleSignOut = () => {
    localStorage.removeItem('crystal_jwt');
    localStorage.removeItem('crystal_user');
    navigate('/auth/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Clinical & Compliance Security Bar */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-md">
        {/* Tier 1: Utility & Status Strip */}
        <div className="bg-slate-900/90 px-4 py-1.5 text-xs border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center space-x-3 text-slate-300">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                HIPAA 256-Bit Encrypted Session Active
              </span>
              <span className="hidden sm:inline text-slate-700">|</span>
              <span className="hidden sm:inline text-slate-400 text-[11px]">
                BAA On File • 45 CFR § 164.312
              </span>
            </div>

            <div className="flex items-center space-x-4 text-xs">
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Phone className="w-3 h-3 text-blue-400" />
                <span>Urgent Clinical Line: <strong className="text-slate-200">{org.contact_phone}</strong></span>
              </span>
              <Link
                to="/"
                className="inline-flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-[11px]"
              >
                <span>Public Site</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Tier 2: App Suite Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/caregiver/portal" className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-base text-white tracking-tight leading-none">
                    {org.name}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {org.state_code}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Healthcare Operations Suite
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {portalNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* User Sign Out & Mobile Toggle */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200">{user.email}</span>
                <span className="text-[10px] uppercase font-bold text-blue-400">
                  {user.role?.replace('_', ' ')}
                </span>
              </div>
            )}

            <button
              onClick={handleSignOut}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-red-500/10 text-slate-300 hover:text-red-400 border border-slate-800 hover:border-red-500/30 text-xs font-semibold transition-colors cursor-pointer"
              title="Sign Out of Secured Healthcare Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>

            <button
              onClick={() => setMobilePortalOpen(!mobilePortalOpen)}
              className="lg:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 cursor-pointer"
              aria-label="Toggle portal menu"
            >
              {mobilePortalOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Portal Navigation Drawer */}
        {mobilePortalOpen && (
          <div className="lg:hidden border-t border-slate-800 bg-slate-950 px-4 py-4 space-y-2">
            {user && (
              <div className="px-3 py-2 mb-2 bg-slate-900/80 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-300 truncate max-w-[180px]">{user.email}</span>
                <span className="text-[10px] font-bold text-blue-400 uppercase">
                  {user.role?.replace('_', ' ')}
                </span>
              </div>
            )}
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2 pb-1">
              Switch Healthcare Portal
            </div>
            {portalNav.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobilePortalOpen(false)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4 text-blue-400 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold">{item.label}</div>
                    <div className="text-[11px] text-slate-400">{item.desc}</div>
                  </div>
                </NavLink>
              );
            })}
            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Portal</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Main Clinical Body */}
      <main className="flex-1 pb-16">
        {children}
      </main>

      {/* Sleek Clinical & Regulatory Portal Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 px-4 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3 text-center md:text-left">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-slate-300">
                {org.name} Secured Healthcare Infrastructure
              </p>
              <p className="text-[11px] text-slate-400">
                Protected Health Information (PHI) handled in strict compliance with HIPAA Omnibus Rule (45 CFR § 164.312).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-[11px]">
            <span className="text-slate-400">
              State Jurisdiction: <strong className="text-white">{org.state_code}</strong>
            </span>
            <span>•</span>
            <span className="text-slate-400">
              License #: <strong className="text-white">{org.license_number}</strong>
            </span>
            <span>•</span>
            <Link to="/" className="text-blue-400 hover:underline">Return to Public Site</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
