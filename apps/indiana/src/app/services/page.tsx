import { INDIANA_ORGANIZATION } from '../../lib/organization';
import { Card, CardHeader, CardTitle, CardDescription, Button, Badge } from '@crystal/ui';
import { ShieldCheck } from 'lucide-react';

export default function IndianaServicesPage() {
  const org = INDIANA_ORGANIZATION;

  return (
    <div className="py-16 space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
        <Badge variant="default" className="text-xs uppercase tracking-wider px-3 py-1 mb-4">
          Indiana Programs & Waiver Services
        </Badge>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Licensed Home Care Services in Indiana
        </h1>
        <p className="text-lg text-gray-600 mt-4 leading-relaxed">
          Cherish Open Arms provides supportive in-home attendant services and family caregiving coaching under Indiana Family & Social Services Administration (FSSA) standards (License #{org.license_number}).
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        {org.enabled_services.map((service) => (
          <Card key={service.slug} id={service.slug} className="p-8 border-l-4 border-l-primary space-y-4">
            <CardHeader className="p-0">
              <CardTitle className="text-2xl">{service.title}</CardTitle>
              <CardDescription className="text-base text-gray-600 pt-2 leading-relaxed">
                {service.description}
              </CardDescription>
            </CardHeader>
            <div className="pt-4 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Licensed in Indiana
              </span>
              <a href="/contact">
                <Button variant="primary" size="sm">
                  Inquire About This Service
                </Button>
              </a>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
