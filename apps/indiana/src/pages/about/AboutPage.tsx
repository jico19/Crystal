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
      title: 'Hoosier Hospitality & Compassion',
      description: 'We treat every client with kindness and warmth, creating trusting relationships that feel like an extension of your own family.',
    },
    {
      title: 'Regulatory & Clinical Rigor',
      description: 'Fully licensed and compliant with Indiana FSSA standards, our registered nurse supervisors oversee all care plans and personal service protocols.',
    },
    {
      title: 'Family-First Philosophy',
      description: 'Through our Structured Family Caregiving (SFC) program, we empower and compensate family caregivers who dedicate their lives to loved ones at home.',
    },
    {
      title: 'Continuity & Reliability',
      description: 'We prioritize consistent caregiver matching so that familiar, trusted aides arrive at your doorstep on every shift.',
    },
  ];

  const countiesServed = [
    'Marion County (Indianapolis)',
    'Hamilton County (Carmel, Fishers, Noblesville)',
    'Hendricks County (Plainfield, Avon)',
    'Johnson County (Greenwood, Franklin)',
    'Boone County (Zionsville, Lebanon)',
    'Hancock County (Greenfield)',
    'Morgan County (Martinsville, Mooresville)',
    'Shelby County (Shelbyville)',
  ];

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>About {org?.name || 'Cherish Open Arms'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Empowering Independence for Hoosier Families
        </h1>
        <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
          {org?.name || 'Cherish Open Arms'} is a premier Indiana home care agency committed to helping seniors and individuals with disabilities remain safe, independent, and cherished in their own homes.
        </p>
      </div>

      {/* Mission Statement Card */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-900 border border-blue-500/30 space-y-4 shadow-xl">
        <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400">Our Mission</h2>
        <p className="text-lg sm:text-xl font-medium text-white leading-relaxed">
          &ldquo;To provide exceptional attendant care, family caregiver empowerment, and personalized home support across Indiana, preserving the independence and dignity of every individual we serve.&rdquo;
        </p>
      </div>

      {/* Core Values Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Our Core Values</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {values.map((val, idx) => (
            <div key={idx} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <h3 className="text-base font-bold text-blue-300">{val.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{val.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Indiana Service Area */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center space-x-3">
          <MapPin className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">Central Indiana Service Area</h2>
            <p className="text-xs text-slate-400">Licensed under Indiana Family & Social Services Administration (FSSA)</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {countiesServed.map((county, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-xs text-slate-300 p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>{county}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact & Careers Banner */}
      <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-6">
        <h2 className="text-2xl font-bold text-white">Have Questions About Indiana Care Options?</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/contact"
            style={{ backgroundColor: 'var(--primary, #1E3A8A)' }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Contact Our Team</span>
          </Link>
          <Link
            to="/apply"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Join Our Caregiving Family</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
