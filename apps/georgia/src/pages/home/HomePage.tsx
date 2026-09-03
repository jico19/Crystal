import React from 'react';
import { Link } from 'react-router';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import { ContactForm } from '../../components/forms/ContactForm.tsx';
import {
  HeartHandshake,
  ShieldCheck,
  Clock,
  Star,
  Users,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  PhoneCall,
  UserCheck,
  CalendarCheck,
  MapPin,
  Heart,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { org } = useOrgTheme();

  const services = [
    {
      title: 'Personal Support Services',
      description: 'Hands-on, dignified assistance with bathing, dressing, grooming, toileting, and transfers.',
      icon: HeartHandshake,
      highlights: ['Bathing & personal hygiene', 'Dressing & grooming assistance', 'Mobility & transfer support', 'Medication reminders'],
    },
    {
      title: 'Companion & Respite Care',
      description: 'Caring companionship, emotional support, and essential respite relief for family caregivers.',
      icon: UserCheck,
      highlights: ['Engaging conversations & activities', 'Meal planning & preparation', 'Light housekeeping & laundry', 'Errands & grocery shopping'],
    },
    {
      title: 'Dementia & Alzheimer’s Support',
      description: 'Specialized memory care designed to foster safety, calm routines, and cognitive engagement at home.',
      icon: Heart,
      highlights: ['Structured daily routines', 'Wandering prevention & home safety', 'Patience-centered communication', 'Cognitive stimulation games'],
    },
    {
      title: 'Post-Hospital Recovery Care',
      description: 'Transitional assistance following surgery, rehab discharge, or hospital stays to prevent readmissions.',
      icon: CalendarCheck,
      highlights: ['Discharge instructions follow-through', 'Mobility rehabilitation support', 'Transportation to follow-up visits', 'Continuous vitals & recovery logging'],
    },
  ];

  const trustMetrics = [
    { label: 'Families Served Across Georgia', value: '1,200+' },
    { label: 'Caregiver Retention Rate', value: '94%' },
    { label: 'Client Satisfaction Score', value: '4.9 / 5' },
    { label: 'Response & Care Placement', value: 'Within 24 Hours' },
  ];

  const testimonials = [
    {
      quote: "With Open Hands provided the exact warmth and dignity my mother needed after her stroke. The caregivers treated her like family from day one.",
      author: "Marcus T.",
      location: "Atlanta, GA",
      relation: "Son of Client",
    },
    {
      quote: "As a primary caregiver, I was burnt out. Their respite care team allowed me to rest knowing my father was safe, well-fed, and smiling.",
      author: "Eleanor S.",
      location: "Decatur, GA",
      relation: "Daughter of Client",
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-teal-400" />
            <span>Licensed GA-DCH Home Care Provider • License #{org?.license_number || 'GA-DCH-987654'}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Compassionate, Dignified <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
              Home Care Across Georgia
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            {org?.branding_theme?.hero_subheading ||
              'Dedicated personal support, companion care, and skilled caregiver assistance for seniors and adults in Atlanta and surrounding counties.'}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#contact"
              style={{ backgroundColor: 'var(--primary, #0F766E)' }}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Request Free Care Consultation</span>
            </a>

            <Link
              to="/apply"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-teal-400" />
              <span>Caregiver Careers: Apply Online</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Quick Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 border-t border-slate-800/80">
            {trustMetrics.map((metric, i) => (
              <div key={i} className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                <div className="text-xl sm:text-2xl font-black text-white">{metric.value}</div>
                <div className="text-[11px] text-slate-400 font-medium mt-0.5">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. SERVICES SECTION */}
      <section id="services" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-3 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Our Comprehensive Care Services</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Tailored In-Home Support for Every Need</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            From companionship to hands-on physical assistance, our state-licensed caregivers deliver personalized support right at home.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-teal-500/50 transition-all duration-300 space-y-4 group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-teal-300 transition-colors">
                      {srv.title}
                    </h3>
                    <span className="text-xs text-slate-400">Personalized Care Plan</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {srv.description}
                </p>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {srv.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center space-x-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. WHY CHOOSE US PILLARS */}
      <section className="bg-slate-900/60 border-y border-slate-800/80 py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400">The With Open Hands Advantage</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Why Georgia Families Choose Us</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Vetted & Licensed Team</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every caregiver undergoes a rigorous 5-step onboarding process, complete with FBI/state fingerprint checks, drug screens, and verified health clearances.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">24/7 Clinical Support</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our care coordinators and clinical supervisors are on-call 24 hours a day, 7 days a week, ensuring you never face an urgent care need alone.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Custom Match Matching</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We thoughtfully pair caregivers based on clinical needs, personality compatibility, and cultural preferences to create genuine, lasting bonds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECRUITMENT BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-teal-900/60 via-slate-900 to-slate-950 border border-teal-500/30 p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>We&apos;re Hiring Caregivers Across Georgia</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Join Our Passionate Caregiving Family</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We offer competitive hourly pay ($18–$24/hr), flexible schedules, paid onboarding, and 24/7 coordinator support. Apply in under 10 minutes with our online wizard.
            </p>
          </div>

          <Link
            to="/apply"
            style={{ backgroundColor: 'var(--primary, #0F766E)' }}
            className="shrink-0 inline-flex items-center space-x-2 px-6 py-3.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl cursor-pointer"
          >
            <span>Start Online Application</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. FAMILY TESTIMONIALS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Client Reviews</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Loved by Families Across Georgia</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex text-amber-400 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="pt-2 border-t border-slate-800 text-xs">
                <span className="font-bold text-white block">{t.author}</span>
                <span className="text-slate-400">{t.relation} • {t.location}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. CONTACT & FREE INQUIRY SECTION */}
      <section id="contact" className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-400">Get In Touch</span>
              <h2 className="text-3xl font-bold text-white">Request a Free In-Home Assessment</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Our care coordinators are ready to answer your questions, walk you through Georgia Medicaid or private pay options, and craft an individualized care schedule.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Georgia Headquarters</strong>
                  <span>{org?.office_address?.street || '100 Peachtree St NW, Suite 1500'}, {org?.office_address?.city || 'Atlanta'}, GA {org?.office_address?.zip || '30303'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <PhoneCall className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <strong className="text-white block">Call Our Care Team</strong>
                  <span>{org?.contact_phone || '(404) 555-0199'} (Mon–Fri 8:30am–5:00pm EST)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-teal-400 shrink-0" />
                <div>
                  <strong className="text-white block">24/7 On-Call Support</strong>
                  <span>{org?.emergency_phone || '(404) 555-0911'} for urgent client needs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Send an Inquiry to Our Georgia Team</h3>
            <p className="text-xs text-slate-400 mb-6">
              Fill out this quick form and our intake coordinator will contact you within 1 business day.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
};
