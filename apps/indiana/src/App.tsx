import { useState } from 'react';
import { BrowserRouter, Routes, Route, useOutletContext } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout.tsx';
import { PortalLayout } from './components/layout/PortalLayout.tsx';
import { CaregiverPortalPage } from './pages/caregiver/CaregiverPortalPage.tsx';
import { ClientOperationsPage } from './pages/clients/ClientOperationsPage.tsx';
import { ClientSelfServicePortalPage } from './pages/clients/ClientSelfServicePortalPage.tsx';
import { AdminCommandCenter } from './components/admin/AdminCommandCenter.tsx';
import { RbacAdminPage } from './pages/admin/settings/RbacAdminPage.tsx';
import { ProtectedRoute } from './components/auth/ProtectedRoute.tsx';
import { PortalDispatcher } from './components/auth/PortalDispatcher.tsx';
import { ScrollToTop } from './components/layout/ScrollToTop.tsx';
import { HomePage } from './pages/home/HomePage.tsx';
import { ServicesPage } from './pages/services/ServicesPage.tsx';
import { AboutPage } from './pages/about/AboutPage.tsx';
import { ContactPage } from './pages/contact/ContactPage.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { ApplyWizardLayout, type WizardContextType } from './pages/apply/ApplyWizardLayout.tsx';
import { Step1PersonalInfo } from './components/caregivers/steps/Step1PersonalInfo.tsx';
import { Step2Availability } from './components/caregivers/steps/Step2Availability.tsx';
import { Step3ExperienceReferences } from './components/caregivers/steps/Step3ExperienceReferences.tsx';
import { Step4Licenses } from './components/caregivers/steps/Step4Licenses.tsx';
import { Step5Attestation } from './components/caregivers/steps/Step5Attestation.tsx';
import {
  CheckCircle2,
  FileCheck2,
  Fingerprint,
  Stethoscope,
  CalendarCheck,
  RotateCcw,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function ApplyWizardStepContainer() {
  const {
    currentStep,
    setCurrentStep,
    markStepComplete,
    draft,
    saveStepData,
    clearDraft,
  } = useOutletContext<WizardContextType>();

  const [submissionResult, setSubmissionResult] = useState<{
    profileId: string;
    status: string;
    submittedAt: string;
  } | null>(null);
  const [isSubmittingFinal, setIsSubmittingFinal] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFinalSubmit = async (step5Data: any) => {
    try {
      setIsSubmittingFinal(true);
      setSubmitError(null);
      saveStepData(5, step5Data, false);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

      // 1. Submit Step 1 to create draft profile & obtain auth token
      const step1Payload = draft.step1;
      if (!step1Payload) {
        throw new Error('Step 1 information is missing. Please review Step 1.');
      }

      const step1Res = await fetch(`${apiUrl}/api/v1/caregivers/application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          org_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
          state_code: 'IN',
          personal_info: step1Payload,
        }),
      });

      const step1Json = await step1Res.json();
      if (!step1Res.ok || !step1Json.success) {
        throw new Error(step1Json.error || 'Failed to initialize application profile.');
      }

      const token = step1Json.data.token;
      const profileId = step1Json.data.profileId;
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // 2. Submit Step 2 Draft if present
      if (draft.step2) {
        await fetch(`${apiUrl}/api/v1/caregivers/application/draft`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ step: 2, data: draft.step2 }),
        });
      }

      // 3. Submit Step 3 Draft if present
      if (draft.step3) {
        await fetch(`${apiUrl}/api/v1/caregivers/application/draft`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ step: 3, data: draft.step3 }),
        });
      }

      // 4. Submit Step 4 Draft if present
      if (draft.step4) {
        await fetch(`${apiUrl}/api/v1/caregivers/application/draft`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ step: 4, data: draft.step4 }),
        });
      }

      // 5. Submit Final Step 5 Attestation
      const step5Res = await fetch(`${apiUrl}/api/v1/caregivers/application/submit`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          ...step5Data,
          attestation_timestamp: new Date().toISOString(),
        }),
      });

      const step5Json = await step5Res.json();
      if (!step5Res.ok || !step5Json.success) {
        throw new Error(step5Json.error || 'Final attestation submission failed.');
      }

      // Persist auth session
      localStorage.setItem('caregiver_profile_id', profileId);
      localStorage.setItem('crystal_jwt', token);

      // Wipe sessionStorage draft
      clearDraft();
      markStepComplete(5);

      setSubmissionResult({
        profileId: step5Json.data?.profileId || profileId,
        status: step5Json.data?.status || 'submitted',
        submittedAt: step5Json.data?.submittedAt || new Date().toISOString(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An error occurred during final submission.';
      setSubmitError(message);
    } finally {
      setIsSubmittingFinal(false);
    }
  };

  if (submissionResult) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-10 shadow-2xl space-y-8 text-center max-w-2xl mx-auto">
        <div className="inline-flex p-4 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Status: Application {submissionResult.status.toUpperCase()}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Application Submitted Successfully!
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm">
            Thank you for applying to join our team. Our clinical onboarding coordinator is reviewing your credentials.
          </p>
          <p className="text-slate-500 text-[11px] font-mono">
            Candidate Reference ID: {submissionResult.profileId}
          </p>
        </div>

        <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-left space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Your Onboarding Checklist & Next Steps:
          </h3>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-xs text-slate-300">
              <FileCheck2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>1. Application Form & Disclosures (Complete)</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <Fingerprint className="w-4 h-4 text-blue-400 shrink-0" />
              <span>2. State & FBI Fingerprint Background Clearance (Pending Dispatch)</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <Stethoscope className="w-4 h-4 text-blue-400 shrink-0" />
              <span>3. TB Screening & Physical Health Attestation Upload</span>
            </div>
            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <CalendarCheck className="w-4 h-4 text-blue-400 shrink-0" />
              <span>4. Clinical Orientation & Client Shift Scheduling</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-center space-x-4">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-4">
      {submitError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {submitError}
        </div>
      )}

      {currentStep === 1 && (
        <Step1PersonalInfo
          initialValues={draft.step1}
          onAutosave={(data) => saveStepData(1, data, true)}
          onSuccess={(data) => {
            saveStepData(1, data, false);
            markStepComplete(1);
          }}
        />
      )}

      {currentStep === 2 && (
        <Step2Availability
          initialValues={draft.step2}
          onAutosave={(data) => saveStepData(2, data, true)}
          onSuccess={(data) => {
            saveStepData(2, data, false);
            markStepComplete(2);
          }}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <Step3ExperienceReferences
          initialValues={draft.step3}
          onAutosave={(data) => saveStepData(3, data, true)}
          onSuccess={(data) => {
            saveStepData(3, data, false);
            markStepComplete(3);
          }}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <Step4Licenses
          initialValues={draft.step4}
          onAutosave={(data) => saveStepData(4, data, true)}
          onSuccess={(data) => {
            saveStepData(4, data, false);
            markStepComplete(4);
          }}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <Step5Attestation
          initialValues={draft.step5}
          isSubmitting={isSubmittingFinal}
          onAutosave={(data) => saveStepData(5, data, true)}
          onSuccess={handleFinalSubmit}
          onBack={() => setCurrentStep(4)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public Marketing & Informational Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <HomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/services"
          element={
            <PublicLayout>
              <ServicesPage />
            </PublicLayout>
          }
        />
        <Route
          path="/about"
          element={
            <PublicLayout>
              <AboutPage />
            </PublicLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <PublicLayout>
              <ContactPage />
            </PublicLayout>
          }
        />
        <Route
          path="/auth/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicLayout>
              <LoginPage />
            </PublicLayout>
          }
        />
        <Route path="/portal" element={<PortalDispatcher />} />

        {/* 5-Step Caregiver Application Wizard Route */}
        <Route path="/apply" element={<ApplyWizardLayout />}>
          <Route index element={<ApplyWizardStepContainer />} />
        </Route>

        {/* Caregiver Onboarding & Compliance Portal */}
        <Route
          path="/caregiver/portal"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'agency_admin', 'caregiver', 'registered_nurse']}>
              <PortalLayout>
                <CaregiverPortalPage />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        {/* Client Management & Authorizations (Staff Ops) */}
        <Route
          path="/clients"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'agency_admin', 'care_coordinator', 'registered_nurse']}>
              <PortalLayout>
                <ClientOperationsPage />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        {/* Client Self-Service Care & Schedule Portal */}
        <Route
          path="/portal/client"
          element={
            <ProtectedRoute>
              <PortalLayout>
                <ClientSelfServicePortalPage />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        {/* Multi-State Admin Command Center */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'agency_admin']}>
              <PortalLayout>
                <AdminCommandCenter />
              </PortalLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin RBAC Settings */}
        <Route
          path="/admin/settings/rbac"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'agency_admin']}>
              <PortalLayout>
                <RbacAdminPage />
              </PortalLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
