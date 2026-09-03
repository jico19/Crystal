import React from 'react';
import { Link } from 'react-router-dom';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import {
  HeartHandshake,
  UserCheck,
  Heart,
  CalendarCheck,
  ShieldCheck,
  CheckCircle2,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { org } = useOrgTheme();

  const services = [
    {
      id: 'personal-care',
      title: 'Personal Support Services (PSS)',
      badge: 'Most Requested',
      description:
        'Hands-on assistance tailored to help seniors and adults with disabilities manage daily living activities safely and comfortably in their own homes.',
      icon: HeartHandshake,
      deliverables: [
        'Bathing, showering, and bed bath assistance',
        'Dressing, grooming, and oral hygiene',
        'Toileting, incontinence care, and peri-care',
        'Safe transfer, ambulation, and mechanical lift assistance',
        'Medication reminders and adherence logging',
        'Range-of-motion exercise encouragement',
      ],
      idealFor: 'Individuals recovering from surgery, stroke, or coping with reduced mobility who need physical help throughout the day.',
    },
    {
      id: 'companion-care',
      title: 'Companion & Homemaker Care',
      badge: 'Daily Living',
      description:
        'Warm, engaging companionship paired with practical household help to alleviate isolation and keep living environments safe and organized.',
      icon: UserCheck,
      deliverables: [
        'Engaging conversation, reading, and companionship',
        'Nutritious meal planning and home-cooked preparation',
        'Light housekeeping, dusting, and linen changing',
        'Grocery shopping, prescription pick-ups, and errands',
        'Accompaniment to medical appointments and social events',
        'Cognitive engagement, puzzles, and hobby support',
      ],
      idealFor: 'Seniors who live alone or whose family members work during the day and want peace of mind and regular check-ins.',
    },
    {
      id: 'dementia-care',
      title: 'Dementia & Alzheimer’s Memory Care',
      badge: 'Specialized',
      description:
        'Patience-centered in-home memory care specifically structured to reduce anxiety, manage wandering tendencies, and preserve dignity.',
      icon: Heart,
      deliverables: [
        'Predictable, calming daily routines and sensory grounding',
        'Wandering prevention, doorway monitoring, and home safety',
        'Compassionate redirection during agitation or sundowning',
        'Reminiscence therapy and memory stimulation exercises',
        'Assistance with personal care adapted for sensory sensitivities',
        'Family caregiver respite and behavioral updates',
      ],
      idealFor: 'Clients living with mild cognitive impairment (MCI), Alzheimer’s, or vascular dementia who thrive in familiar surroundings.',
    },
    {
      id: 'respite-care',
      title: 'Family Caregiver Respite Care',
      badge: 'Caregiver Relief',
      description:
        'Short-term, scheduled relief for dedicated family caregivers, preventing burnout while ensuring loved ones continue receiving premium care.',
      icon: CalendarCheck,
      deliverables: [
        'Flexible blocks: 4 hours, 8 hours, or overnight shifts',
        'Weekend and holiday coverage',
        'Seamless handoff following your exact family routine',
        'Full personal care and meal prep during coverage',
        'Emergency short-notice coverage when possible',
      ],
      idealFor: 'Spouses, adult children, and family caregivers who need time for work, personal appointments, travel, or essential self-care.',
    },
  ];

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-teal-400" />
          <span>Georgia Licensed Home Care Provider • {org?.license_number || 'GA-DCH-987654'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Comprehensive Care Services in Georgia
        </h1>
        <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
          From a few hours of companion care each week to 24/7 personal care assistance, our registered nurse-directed care plans adapt to your family&apos;s unique needs.
        </p>
      </div>

      {/* Services Detailed List */}
      <div className="space-y-8">
        {services.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              id={service.id}
              className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl hover:border-teal-500/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{service.title}</h2>
                    <span className="text-xs text-slate-400">Customized Clinical Care Plan</span>
                  </div>
                </div>
                <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-slate-800 text-teal-300 font-semibold border border-slate-700">
                  {service.badge}
                </span>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">
                {service.description}
              </p>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Included In This Service:
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {service.deliverables.map((item, idx) => (
                    <div key={idx} className="flex items-start space-x-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400">
                <strong className="text-slate-200">Recommended For: </strong>
                {service.idealFor}
              </div>
            </div>
          );
        })}
      </div>

      {/* CTA Bottom Card */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-6">
        <h2 className="text-2xl font-bold text-white">Not Sure What Level of Care You Need?</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Our Georgia clinical supervisor provides a free in-home assessment to evaluate safety, medical needs, and lifestyle preferences.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/contact"
            style={{ backgroundColor: 'var(--primary, #0F766E)' }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Schedule Free Consultation</span>
          </Link>
          <Link
            to="/apply"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-teal-400" />
            <span>Apply as a Caregiver</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
