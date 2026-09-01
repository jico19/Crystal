import { GEORGIA_ORGANIZATION } from '../../lib/organization';
import { Badge, Card, CardHeader, CardTitle, CardDescription } from '@crystal/ui';
import { ShieldCheck, Heart, Award, Users } from 'lucide-react';

export default function GeorgiaAboutPage() {
  const org = GEORGIA_ORGANIZATION;

  return (
    <div className="py-16 space-y-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center max-w-3xl">
        <Badge variant="default" className="text-xs uppercase tracking-wider px-3 py-1 mb-4">
          About With Open Hands
        </Badge>
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
          Dedicated to Quality Care in Georgia
        </h1>
        <p className="text-lg text-gray-600 mt-4 leading-relaxed">
          Founded with a mission to bring compassionate, reliable, and family-centered in-home care to individuals across Greater Atlanta and Georgia counties.
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="text-center p-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <CardTitle>State Compliance</CardTitle>
          <CardDescription className="mt-2">
            Licensed by Georgia Department of Community Health (License #{org.license_number}) following strict healthcare safety rules.
          </CardDescription>
        </Card>

        <Card className="text-center p-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <CardTitle>Compassionate Staff</CardTitle>
          <CardDescription className="mt-2">
            Every caregiver undergoes rigorous multi-state criminal background checks, CPR training, TB screening, and ongoing skill assessments.
          </CardDescription>
        </Card>

        <Card className="text-center p-8">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8" />
          </div>
          <CardTitle>Family Peace of Mind</CardTitle>
          <CardDescription className="mt-2">
            We provide direct communication channels, customized RN care plans, and 24/7 on-call coordinator support for emergencies.
          </CardDescription>
        </Card>
      </div>
    </div>
  );
}
