import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'sonner';
import { WizardHeader } from '../../components/apply/WizardHeader.tsx';
import { StepIndicator } from '../../components/apply/StepIndicator.tsx';
import { ResumeDraftModal } from '../../components/apply/ResumeDraftModal.tsx';
import { useWizardDraft, type WizardDraftData } from '../../hooks/useWizardDraft.ts';

export interface WizardContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  completedSteps: number[];
  markStepComplete: (step: number) => void;
  draft: WizardDraftData;
  saveStepData: (step: 1 | 2 | 3 | 4 | 5, data: any, showToast?: boolean) => void;
  clearDraft: () => void;
}

export const ApplyWizardLayout: React.FC = () => {
  const {
    draft,
    currentStep,
    completedSteps,
    saveStepData,
    markStepComplete,
    setCurrentStep,
    clearDraft,
    hasExistingDraft,
  } = useWizardDraft();

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showResumeModal, setShowResumeModal] = useState<boolean>(() => hasExistingDraft);
  const navigate = useNavigate();

  const handleSaveAndExit = async () => {
    try {
      setIsSaving(true);
      toast.info('Draft stored in session. It will remain until browser is closed.', {
        duration: 3000,
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate('/');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResume = () => {
    setShowResumeModal(false);
    toast.success(`Resumed application at Step ${currentStep}`, {
      duration: 2500,
    });
  };

  const handleStartFresh = () => {
    clearDraft();
    setShowResumeModal(false);
    toast.info('Draft reset. Starting fresh from Step 1.', {
      duration: 2500,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Toaster richColors position="top-right" theme="dark" />

      <ResumeDraftModal
        isOpen={showResumeModal}
        draft={draft}
        onResume={handleResume}
        onStartFresh={handleStartFresh}
      />

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
        <Outlet
          context={{
            currentStep,
            setCurrentStep,
            completedSteps,
            markStepComplete,
            draft,
            saveStepData,
            clearDraft,
          }}
        />
      </main>
    </div>
  );
};
