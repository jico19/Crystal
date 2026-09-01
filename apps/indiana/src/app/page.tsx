import { INDIANA_ORGANIZATION } from '../lib/organization';
import { Button, Card, CardHeader, CardTitle, CardDescription, Badge } from '@crystal/ui';
import {
  HeartHandshake,
  ShieldCheck,
  Award,
  Clock,
  Heart,
  Users,
  CheckCircle,
  ArrowRight,
  Phone,
} from 'lucide-react';

export default function IndianaHomePage() {
  const org = INDIANA_ORGANIZATION;

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-white to-white pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-900 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                Licensed by the Indiana Family & Social Services Administration (FSSA)
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                Dedicated In-Home Care for <span className="text-primary">Indiana Families</span>.
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 leading-relaxed max-w-2xl">
                {org.branding_theme.hero_subheading}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a href="/contact">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto shadow-lg shadow-blue-950/20">
                    Schedule Free Consultation
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href={`tel:${org.contact_phone}`}>
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    <Phone className="w-4 h-4 mr-2" />
                    Call {org.contact_phone}
                  </Button>
                </a>
              </div>

              {/* Trust Indicators */}
              <div className="pt-8 border-t border-gray-100 grid grid-cols-3 gap-6 text-left">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">100%</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">FSSA Vetted & CPR Certified</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">24/7</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">On-Call Support in Indianapolis</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">Medicaid</div>
                  <div className="text-xs text-gray-500 font-medium mt-1">A&D and PathWays Approved</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl bg-gradient-to-tr from-primary to-slate-900 p-8 text-white shadow-2xl space-y-6">
                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-white">
                  <HeartHandshake className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold">Why Indiana Families Choose Cherish Open Arms</h3>
                <ul className="space-y-3.5 text-sm text-blue-100">
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>State-approved Structured Family Caregiving coaching</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Comprehensive background checks, TB test, and CPR compliance</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Consistent attendant matching ensuring familiarity & dignity</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span>Personalized care coordination tailored to waiver programs</span>
                  </li>
                </ul>
                <div className="pt-4 border-t border-white/20 flex items-center justify-between text-xs">
                  <span>FSSA License: {org.license_number}</span>
                  <span className="font-semibold text-accent">Indianapolis, IN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="default" className="text-xs uppercase tracking-wider px-3 py-1">
            Indiana Care Programs
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Supportive Services Designed for Independence
          </h2>
          <p className="text-gray-600 text-base leading-relaxed">
            Personal care assistance, companion support, and structured family caregiving across Central Indiana.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {org.enabled_services.map((service) => (
            <Card key={service.slug} className="flex flex-col justify-between border-t-4 border-t-primary">
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Heart className="w-6 h-6" />
                </div>
                <CardTitle className="text-lg">{service.title}</CardTitle>
                <CardDescription>{service.description}</CardDescription>
              </CardHeader>
              <div className="px-6 pb-6 pt-2">
                <a
                  href={`/services#${service.slug}`}
                  className="text-sm font-semibold text-primary hover:text-blue-900 inline-flex items-center gap-1"
                >
                  Learn More <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gray-900 text-white p-8 sm:p-14 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold max-w-2xl mx-auto">
            Ready to Explore In-Home Care Options in Indiana?
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base">
            Reach out to our Indianapolis office today to connect with an experienced care manager.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <a href="/contact">
              <Button variant="primary" size="lg">
                Contact Our Indiana Office
              </Button>
            </a>
            <a href={`tel:${org.contact_phone}`}>
              <Button variant="outline" size="lg" className="border-gray-700 text-white hover:bg-gray-800">
                Call {org.contact_phone}
              </Button>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
