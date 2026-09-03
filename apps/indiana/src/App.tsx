import { useState } from 'react';
import { BrowserRouter, Routes, Route, useOutletContext } from 'react-router-dom';
import { PublicLayout } from './components/layout/PublicLayout.tsx';
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
  const { currentStep, setCurrentStep, markStepComplete } = useOutletContext<WizardContextType>();
  const [submissionResult, setSubmissionResult] = useState<{
    profileId: string;
    status: string;
    submittedAt: string;
  } | null>(null);

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
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl">
      {currentStep === 1 && (
        <Step1PersonalInfo onSuccess={() => markStepComplete(1)} />
      )}

      {currentStep === 2 && (
        <Step2Availability
          onSuccess={() => markStepComplete(2)}
          onBack={() => setCurrentStep(1)}
        />
      )}

      {currentStep === 3 && (
        <Step3ExperienceReferences
          onSuccess={() => markStepComplete(3)}
          onBack={() => setCurrentStep(2)}
        />
      )}

      {currentStep === 4 && (
        <Step4Licenses
          onSuccess={() => markStepComplete(4)}
          onBack={() => setCurrentStep(3)}
        />
      )}

      {currentStep === 5 && (
        <Step5Attestation
          onSuccess={(result) => {
            markStepComplete(5);
            setSubmissionResult(result);
          }}
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

        {/* 5-Step Caregiver Application Wizard Route */}
        <Route path="/apply" element={<ApplyWizardLayout />}>
          <Route index element={<ApplyWizardStepContainer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
