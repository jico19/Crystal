import React from 'react';
import { Link } from 'react-router-dom';
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
  MapPin,
  Home,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { org } = useOrgTheme();

  const services = [
    {
      title: 'Attendant Care Services (A&D Waiver)',
      description: 'Hands-on personal assistance for seniors and individuals with physical disabilities to maintain independence at home.',
      icon: ShieldCheck,
      highlights: ['Bathing, grooming & hygiene', 'Mobility & mechanical lift transfers', 'Incontinence care & toileting', 'Nutritional meal planning'],
    },
    {
      title: 'Structured Family Caregiving (SFC)',
      description: 'Support and daily coaching enabling qualified family members to serve as compensated primary caregivers in the home.',
      icon: Users,
      highlights: ['Paid family caregiving compensation', 'Dedicated registered nurse coaching', 'Monthly in-home supervisory visits', 'Respite relief support'],
    },
    {
      title: 'Homemaker & Essential Support',
      description: 'Practical daily household management creating a clean, safe, and organized living environment.',
      icon: Home,
      highlights: ['Light housekeeping & laundry', 'Grocery shopping & prescription runs', 'Nutritious meal preparation', 'Safe home environment upkeep'],
    },
    {
      title: 'Respite Care for Caregivers',
      description: 'Scheduled, reliable relief allowing family members to rest and recharge with complete peace of mind.',
      icon: HeartHandshake,
      highlights: ['Flexible hourly or overnight relief', 'Consistent and trained substitutes', 'Medication supervision', 'Detailed daily shift logs'],
    },
  ];

  const trustMetrics = [
    { label: 'Hoosier Families Supported', value: '950+' },
    { label: 'Caregiver Retention Rate', value: '96%' },
    { label: 'Family Satisfaction Score', value: '4.9 / 5' },
    { label: 'Indiana Counties Covered', value: '18 Counties' },
  ];

  const testimonials = [
    {
      quote: "Cherish Open Arms made the Indiana Medicaid Waiver process so simple. Their attendant care coordinator was empathetic, prompt, and matched us with an incredible aide.",
      author: "David K.",
      location: "Indianapolis, IN",
      relation: "Husband of Client",
    },
    {
      quote: "The Structured Family Caregiving program changed our lives. Being able to care for my disabled daughter full-time with their clinical team backing me is a blessing.",
      author: "Samantha M.",
      location: "Carmel, IN",
      relation: "Mother & SFC Caregiver",
    },
  ];

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 sm:px-6">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>FSSA Certified Home Care Provider • License #{org?.license_number || 'IN-FSSA-123456'}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            Trusted, Dignified <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Home Care Across Indiana
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-slate-300 text-base sm:text-lg leading-relaxed">
            {org?.branding_theme?.hero_subheading ||
              'Empowering seniors and individuals with disabilities to live independently with dignity throughout Central Indiana.'}
          </p>

          {/* Call to Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#contact"
              style={{ backgroundColor: 'var(--primary, #1E3A8A)' }}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all shadow-lg cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Request Free Care Consultation</span>
            </a>

            <Link
              to="/apply"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400" />
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
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Indiana Waiver & Private Support</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Our Specialized Home Care Services</h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Authorized provider under the Indiana Aged & Disabled (A&D) Waiver, Traumatic Brain Injury (TBI) Waiver, and private payment plans.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-blue-500/50 transition-all duration-300 space-y-4 group"
              >
                <div className="flex items-center space-x-3.5">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                      {srv.title}
                    </h3>
                    <span className="text-xs text-slate-400">Customized Service Plan</span>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {srv.description}
                </p>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  {srv.highlights.map((h, hIdx) => (
                    <div key={hIdx} className="flex items-center space-x-2 text-xs text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0" />
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
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400">The Cherish Open Arms Difference</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Why Indiana Families Place Their Trust in Us</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Indiana Waiver Specialists</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We guide families seamlessly through the Indiana FSSA Medicaid Waiver application, case manager coordination, and authorization process.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">24/7 Clinical Supervisor</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Registered nurses and experienced care coordinators remain on call 24 hours a day to handle emergency needs or unexpected schedule changes.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="p-2.5 w-fit rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Consistent, Trusted Aides</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                We believe in continuity of care. We pair your loved one with dedicated, compatible caregivers rather than rotating unfamiliar strangers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECRUITMENT BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-slate-950 border border-blue-500/30 p-8 sm:p-12 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>We&apos;re Hiring Caregivers Across Central Indiana</span>
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">Make a Meaningful Impact as a Caregiver</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Enjoy premium hourly rates, paid mileage, flexible scheduling near your home, and comprehensive training. Complete our quick 5-step online application today.
            </p>
          </div>

          <Link
            to="/apply"
            style={{ backgroundColor: 'var(--primary, #1E3A8A)' }}
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
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Hoosier Testimonials</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Trusted by Families in Indianapolis & Beyond</h2>
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
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Get In Touch</span>
              <h2 className="text-3xl font-bold text-white">Schedule a Free Care Consultation</h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Our care advisors are ready to assist with Medicaid Waiver eligibility questions, SFC enrollment, or private pay arrangements.
              </p>
            </div>

            <div className="space-y-3 p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <div className="flex items-start space-x-2.5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white block">Indiana Office</strong>
                  <span>{org?.office_address?.street || '200 S Meridian St, Suite 400'}, {org?.office_address?.city || 'Indianapolis'}, IN {org?.office_address?.zip || '46225'}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <PhoneCall className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <strong className="text-white block">Call Our Office</strong>
                  <span>{org?.contact_phone || '(317) 555-0288'} (Mon–Fri 8:30am–5:00pm EST)</span>
                </div>
              </div>

              <div className="flex items-center space-x-2.5">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <strong className="text-white block">24/7 Clinical Hotline</strong>
                  <span>{org?.emergency_phone || '(317) 555-0911'} for urgent client needs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Send an Inquiry to Our Indiana Team</h3>
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
