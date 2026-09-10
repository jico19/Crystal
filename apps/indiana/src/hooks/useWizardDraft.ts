import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface WizardDraftData {
  currentStep: number;
  completedSteps: number[];
  step1?: any;
  step2?: any;
  step3?: any;
  step4?: any;
  step5?: any;
  lastSavedAt?: string;
}

const STORAGE_KEY = 'crystal_caregiver_wizard_draft';

export function getSavedDraft(): WizardDraftData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse wizard draft from sessionStorage:', err);
    return null;
  }
}

export function saveDraftToStorage(draft: WizardDraftData): void {
  try {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...draft,
        lastSavedAt: new Date().toISOString(),
      })
    );
  } catch (err) {
    console.error('Failed to save wizard draft to sessionStorage:', err);
  }
}

export function clearDraftFromStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear wizard draft from sessionStorage:', err);
  }
}

export function useWizardDraft() {
  const [draft, setDraft] = useState<WizardDraftData>(() => {
    return (
      getSavedDraft() || {
        currentStep: 1,
        completedSteps: [],
      }
    );
  });

  const lastToastTimeRef = useRef<number>(0);

  const saveStepData = useCallback(
    (step: 1 | 2 | 3 | 4 | 5, data: any, showToast = true) => {
      const stepKey = `step${step}` as const;
      setDraft((prev) => {
        const next: WizardDraftData = {
          ...prev,
          [stepKey]: data,
          lastSavedAt: new Date().toISOString(),
        };
        saveDraftToStorage(next);
        return next;
      });

      if (showToast) {
        const now = Date.now();
        if (now - lastToastTimeRef.current > 3000) {
          toast.success('Progress autosaved to session', {
            id: 'wizard-autosave',
            duration: 2000,
          });
          lastToastTimeRef.current = now;
        }
      }
    },
    []
  );

  const markStepComplete = useCallback(
    (step: number) => {
      setDraft((prev) => {
        const completed = prev.completedSteps.includes(step)
          ? prev.completedSteps
          : [...prev.completedSteps, step];
        const nextStep = step < 5 ? step + 1 : step;
        const next: WizardDraftData = {
          ...prev,
          completedSteps: completed,
          currentStep: nextStep,
        };
        saveDraftToStorage(next);
        return next;
      });

      toast.success(`Step ${step} completed & saved`, {
        duration: 2500,
      });
    },
    []
  );

  const setCurrentStep = useCallback((step: number) => {
    setDraft((prev) => {
      const next = { ...prev, currentStep: step };
      saveDraftToStorage(next);
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    clearDraftFromStorage();
    setDraft({
      currentStep: 1,
      completedSteps: [],
    });
  }, []);

  return {
    draft,
    currentStep: draft.currentStep,
    completedSteps: draft.completedSteps,
    saveStepData,
    markStepComplete,
    setCurrentStep,
    clearDraft,
    hasExistingDraft: !!(draft.step1 || draft.completedSteps.length > 0),
  };
}
