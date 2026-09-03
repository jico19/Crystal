import React from 'react';
import { Link } from 'react-router-dom';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import {
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const { org } = useOrgTheme();

  const values = [
    {
      title: 'Dignity & Respect',
      description: 'We treat every client with the utmost respect, listening to their preferences, honoring their personal autonomy, and safeguarding their self-esteem.',
    },
    {
      title: 'Clinical Rigor',
      description: 'Care plans are developed and supervised by registered nurses, ensuring all personal care aligns with medical needs and state healthcare regulations.',
    },
    {
      title: 'Caregiver Excellence',
      description: 'We invest heavily in our caregiving staff through above-market pay, continuous training, and clinical coaching, resulting in extraordinary 94%+ caregiver retention.',
    },
    {
      title: 'Transparent Communication',
      description: 'Family members enjoy complete visibility with daily shift notes, electronic visit verification (EVV), and 24/7 direct access to care coordinators.',
    },
  ];

  const countiesServed = [
    'Fulton County',
    'DeKalb County',
    'Cobb County',
    'Gwinnett County',
    'Clayton County',
    'Cherokee County',
    'Forsyth County',
    'Henry County',
  ];

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>About {org?.name || 'With Open Hands'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Caring for Georgia Families with Heart & Integrity
        </h1>
        <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
          Founded with a commitment to elevate the standard of home-based care, {org?.name || 'With Open Hands'} delivers dignified personal support and companion care across Greater Atlanta.
        </p>
      </div>

      {/* Mission Statement Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-teal-950/60 via-slate-900 to-slate-900 border border-teal-500/30 space-y-4 shadow-xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-teal-400">Our Mission</h2>
        <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">
          &ldquo;To empower seniors, individuals with disabilities, and recovering adults to live safely, independently, and comfortably in their own homes, while providing family caregivers with dependable relief and total peace of mind.&rdquo;
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((val, idx) => (
            <div key={idx} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-base font-bold text-teal-300">{val.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{val.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Georgia Service Area */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-3">
          <MapPin className="w-6 h-6 text-teal-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Georgia Counties Served</h2>
            <p className="text-xs text-slate-400">Operating under Georgia Department of Community Health (DCH)</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {countiesServed.map((county, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
              <span>{county}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Careers Banner */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6">
        <h2 className="text-2xl font-bold text-white">Ready to Connect With Our Care Team?</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/contact"
            style={{ backgroundColor: 'var(--primary, #0F766E)' }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Our Team</span>
          </Link>
          <Link
            to="/apply"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Join Our Caregiving Family</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
