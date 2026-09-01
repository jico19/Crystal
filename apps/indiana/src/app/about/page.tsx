import { INDIANA_ORGANIZATION } from '../../lib/organization';
import { Badge, Card, CardTitle, CardDescription } from '@crystal/ui';
import { ShieldCheck, Heart, Users } from 'lucide-react';

export default function IndianaAboutPage() {
  const org = INDIANA_ORGANIZATION;

  return (
    <div className="py-16 space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
        <Badge variant="default" className="text-xs uppercase tracking-wider px-3 py-1 mb-4">
          About Cherish Open Arms
        </Badge>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Empowering Independence for Indiana Residents
        </h1>
        <p className="text-lg text-gray-600 mt-4 leading-relaxed">
          Based in Indianapolis, Cherish Open Arms was created to bridge gaps in home care with compassionate, individualized attendant care and family support services.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="text-center p-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <CardTitle>Indiana FSSA Licensed</CardTitle>
          <CardDescription className="mt-2">
            Licensed by the Indiana Family & Social Services Administration (License #{org.license_number}) ensuring strict compliance with state health standards.
          </CardDescription>
        </Card>

        <Card className="text-center p-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <CardTitle>Vetted & Trained Attendants</CardTitle>
          <CardDescription className="mt-2">
            All attendants undergo comprehensive Indiana state background checks, CPR certification, and ongoing skills training.
          </CardDescription>
        </Card>

        <Card className="text-center p-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <CardTitle>Structured Family Support</CardTitle>
          <CardDescription className="mt-2">
            We guide family members through state waiver programs, providing coaching, compensation assistance, and peace of mind.
          </CardDescription>
        </Card>
      </div>
    </div>
  );
}
