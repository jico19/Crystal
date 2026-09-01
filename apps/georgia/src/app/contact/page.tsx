import { GEORGIA_ORGANIZATION } from '../../lib/organization';
import { ContactForm, Badge } from '@crystal/ui';
import { Phone, Mail, MapPin, Clock, ShieldCheck } from 'lucide-react';

export default function GeorgiaContactPage() {
  const org = GEORGIA_ORGANIZATION;

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="default" className="text-xs uppercase tracking-wider px-3 py-1 mb-4">
            Georgia Office & Inquiries
          </Badge>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Contact With Open Hands
          </h1>
          <p className="text-lg text-gray-600 mt-4">
            Connect directly with our Atlanta care coordination team to discuss in-home care services or caregiver career opportunities.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Office Info */}
          <div className="lg:col-span-5 space-y-8 bg-teal-50/50 p-8 rounded-3xl border border-teal-100">
            <h3 className="text-2xl font-bold text-gray-900">Atlanta Headquarters</h3>
            
            <div className="space-y-6 text-gray-700">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Office Address</div>
                  <div className="text-sm text-gray-600">
                    {org.office_address.street}<br />
                    {org.office_address.city}, {org.office_address.state} {org.office_address.zip}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Phone Support</div>
                  <a href={`tel:${org.contact_phone}`} className="text-sm text-primary font-bold hover:underline block">
                    {org.contact_phone}
                  </a>
                  <span className="text-xs text-gray-500">24/7 on-call coordinator</span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Email Address</div>
                  <a href={`mailto:${org.contact_email}`} className="text-sm text-primary hover:underline block">
                    {org.contact_email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Hours of Operation</div>
                  <div className="text-sm text-gray-600">{org.office_hours}</div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-teal-200 text-xs text-gray-600 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
              <span>Georgia DCH Regulated Agency License #{org.license_number}</span>
            </div>
          </div>

          {/* Interactive Form */}
          <div className="lg:col-span-7">
            <ContactForm organization={org} />
          </div>
        </div>
      </div>
    </div>
  );
}
