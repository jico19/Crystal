import React from 'react';
import { Link } from 'react-router-dom';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import {
  ShieldCheck,
  Users,
  Home,
  HeartHandshake,
  CheckCircle2,
  PhoneCall,
  Sparkles,
} from 'lucide-react';

export const ServicesPage: React.FC = () => {
  const { org } = useOrgTheme();

  const services = [
    {
      id: 'attendant-care',
      title: 'Attendant Care Services (A&D Waiver)',
      badge: 'Medicaid Waiver',
      description:
        'Hands-on personal assistance for seniors and individuals with physical disabilities under the Indiana FSSA Aged & Disabled Waiver and Community Integration and Habilitation (CIH) programs.',
      icon: ShieldCheck,
      deliverables: [
        'Bathing, showering, and specialized hygiene care',
        'Dressing and grooming assistance',
        'Safe transfers, Hoyer lift operation, and positioning',
        'Toileting, incontinence care, and catheter support',
        'Meal preparation and nutritional feeding assistance',
        'Medication reminders and vital signs monitoring',
      ],
      idealFor: 'Hoosiers who qualify for Indiana Medicaid Waiver programs and require daily physical assistance to live safely at home.',
    },
    {
      id: 'structured-family-caregiving',
      title: 'Structured Family Caregiving (SFC)',
      badge: 'Family Support',
      description:
        'A state-approved program allowing eligible family members living in the home to receive daily financial compensation, structured training, and monthly RN coaching as primary caregivers.',
      icon: Users,
      deliverables: [
        'Tax-exempt daily caregiving financial stipends',
        'Dedicated Registered Nurse (RN) clinical coaching',
        'Monthly home supervisory visits and support',
        'Structured digital care notes and health tracking',
        'Caregiver wellness support and scheduled respite breaks',
      ],
      idealFor: 'Family members who are currently providing full-time care for an eligible relative and want financial support and professional nursing backup.',
    },
    {
      id: 'homemaker-services',
      title: 'Homemaker & Essential Household Support',
      badge: 'Home Management',
      description:
        'Practical household assistance ensuring clean, sanitary, and hazard-free home environments for seniors and individuals with mobility restrictions.',
      icon: Home,
      deliverables: [
        'Light housekeeping, vacuuming, and mopping',
        'Laundry and bed linen changes',
        'Grocery shopping, errand running, and prescription pickup',
        'Meal planning and refrigerator maintenance',
        'Home safety decluttering and hazard mitigation',
      ],
      idealFor: 'Individuals who can handle some self-care but struggle with heavy chore work, grocery shopping, or maintaining a tidy home.',
    },
    {
      id: 'respite-services',
      title: 'Respite Relief Services',
      badge: 'Caregiver Relief',
      description:
        'Reliable, pre-scheduled relief shifts that allow family caregivers to attend to personal needs, work, rest, or travel without worrying about their loved one’s safety.',
      icon: HeartHandshake,
      deliverables: [
        'Scheduled daytime, evening, or weekend blocks',
        'Overnight and 24-hour respite coverage',
        'Seamless adherence to client routines and dietary restrictions',
        'Detailed visit documentation for peace of mind',
      ],
      idealFor: 'Family members providing round-the-clock care who need dependable breaks to prevent physical and emotional caregiver exhaustion.',
    },
  ];

  return (
    <div className="space-y-16 py-8 px-4 sm:px-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Indiana FSSA Certified Home Care Provider • {org?.license_number || 'IN-FSSA-123456'}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          Specialized Home Care Services in Indiana
        </h1>
        <p className="max-w-2xl mx-auto text-slate-300 text-sm sm:text-base leading-relaxed">
          Authorized provider for Indiana Medicaid Waiver programs, Structured Family Caregiving, and personalized private care across Central Indiana.
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
              className="p-6 sm:p-8 rounded-2xl bg-slate-900 border border-slate-800 space-y-6 shadow-xl hover:border-blue-500/40 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{service.title}</h2>
                    <span className="text-xs text-slate-400">Indiana Waiver Authorized Service</span>
                  </div>
                </div>
                <span className="self-start sm:self-auto text-xs px-3 py-1 rounded-full bg-slate-800 text-blue-300 font-semibold border border-slate-700">
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
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
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
        <h2 className="text-2xl font-bold text-white">Need Help Navigating the Indiana Medicaid Waiver?</h2>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
          Our intake coordinators guide you through eligibility, case manager communication, and waiver authorization at zero cost to your family.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/contact"
            style={{ backgroundColor: 'var(--primary, #1E3A8A)' }}
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all shadow-md cursor-pointer"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Schedule Free Consultation</span>
          </Link>
          <Link
            to="/apply"
            className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Apply as a Caregiver</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
