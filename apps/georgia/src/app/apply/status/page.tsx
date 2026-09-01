'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { GEORGIA_ORGANIZATION } from '../../../lib/organization';
import { OnboardingTracker } from '@crystal/ui';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function GeorgiaApplyStatusContent() {
  const org = GEORGIA_ORGANIZATION;
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const userId =
        searchParams.get('user_id') ||
        (typeof window !== 'undefined' ? localStorage.getItem('crystal_caregiver_guest_id_ga') : null) ||
        'anonymous';

      try {
        const url = `${apiBaseUrl}/api/v1/caregivers/onboarding-status?user_id=${encodeURIComponent(userId)}&org_id=${encodeURIComponent(org.id)}&state_code=${encodeURIComponent(org.state_code)}`;
        const res = await fetch(url);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            setStatus({
              application_status: json.application_status,
              application_step: json.application_step,
              submitted_at: json.submitted_at || new Date().toISOString(),
              approved_at: json.approved_at,
              onboarding_checklist: json.onboarding_checklist,
              completion_percentage: json.completion_percentage,
            });
            setLoading(false);
            return;
          }
        }
      } catch {
        // Fallback below
      }

      // Default initial state
      setStatus({
        application_status: 'submitted',
        application_step: 5,
        submitted_at: new Date().toISOString(),
        approved_at: null,
        onboarding_checklist: {
          application_form: 'submitted',
          id_documents: 'not_started',
          background_check: 'not_started',
          tb_physical: 'not_started',
          in_service_orientation: 'not_started',
          direct_deposit_w4: 'not_started',
          final_admin_approval: 'not_started',
        },
        completion_percentage: 14,
      });
      setLoading(false);
    };

    fetchStatus();
  }, [org.id, org.state_code, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-medium">Loading your application status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900">Application Submitted!</h1>
              <p className="text-gray-500 text-sm">With Open Hands — Georgia</p>
            </div>
          </div>
          <p className="mt-4 text-gray-600">
            Thank you for applying! Our recruitment team will review your application and reach out
            within 3–5 business days. Track your progress below.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {status && (
          <OnboardingTracker
            checklist={status.onboarding_checklist}
            applicationStatus={status.application_status}
            completionPercentage={status.completion_percentage}
            submittedAt={status.submitted_at}
          />
        )}

        {/* Action Card: Upload Credential Documents */}
        <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50/50 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-teal-950">Next Step: Upload Required Credentials</h3>
            <p className="mt-1 text-xs text-teal-800">
              Accelerate your onboarding by uploading your CPR card, TB clearance, and driver&apos;s license to our secure vault.
            </p>
          </div>
          <Link
            href={`/apply/documents?user_id=${encodeURIComponent(
              searchParams.get('user_id') ||
                (typeof window !== 'undefined'
                  ? localStorage.getItem('crystal_caregiver_guest_id_ga') || ''
                  : '') ||
                'ga-caregiver-demo-01'
            )}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition-colors shadow-sm"
          >
            Open Credential Vault &rarr;
          </Link>
        </div>
        <div className="mt-6 text-center text-sm text-gray-500">
          Questions? Call us at{' '}
          <a href={`tel:${org.contact_phone}`} className="text-teal-700 font-medium hover:underline">
            {org.contact_phone}
          </a>
        </div>
      </div>
    </div>
  );
}

export default function GeorgiaApplyStatusPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-gray-500 font-medium">Loading your application status...</div>
        </div>
      }
    >
      <GeorgiaApplyStatusContent />
    </Suspense>
  );
}
