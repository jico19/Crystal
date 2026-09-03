import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { WizardHeader } from '../../components/apply/WizardHeader.tsx';
import { StepIndicator } from '../../components/apply/StepIndicator.tsx';

export interface WizardContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completedSteps: number[];
  markStepComplete: (step: number) => void;
}

export const ApplyWizardLayout: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSaveAndExit = async () => {
    try {
      setIsSaving(true);
      // Wait for any pending auto-saves
      await new Promise((resolve) => setTimeout(resolve, 600));
      navigate('/');
    } finally {
      setIsSaving(false);
    }
  };

  const markStepComplete = (step: number) => {
    if (!completedSteps.includes(step)) {
      setCompletedSteps((prev) => [...prev, step]);
    }
    if (step < 5) {
      setCurrentStep(step + 1);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <WizardHeader
        currentStep={currentStep}
        totalSteps={5}
        onSaveAndExit={handleSaveAndExit}
        isSaving={isSaving}
      />

      <div className="bg-slate-900/60 border-b border-slate-800/80">
        <StepIndicator
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepSelect={(step) => setCurrentStep(step)}
        />
      </div>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Outlet context={{ currentStep, setCurrentStep, completedSteps, markStepComplete }} />
      </main>
    </div>
  );
};
