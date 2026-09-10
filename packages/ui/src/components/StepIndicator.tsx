import React from 'react';
import { Check } from 'lucide-react';

export interface Step {
  id: number;
  label: string;
  description?: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
  allowStepJump?: boolean;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  steps,
  currentStep,
  onStepClick,
  allowStepJump = false,
}) => {
  return (
    <div className="w-full py-4">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, idx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isClickable = allowStepJump && (isCompleted || isCurrent);

            return (
              <li
                key={step.id}
                className={`relative flex flex-col items-center flex-1 ${
                  idx !== steps.length - 1 ? 'pr-4 sm:pr-8' : ''
                }`}
              >
                {/* Connecting Line */}
                {idx !== steps.length - 1 && (
                  <div
                    className={`absolute top-4 left-1/2 w-full h-0.5 -translate-y-1/2 z-0 transition-colors ${
                      currentStep > step.id ? 'bg-primary-600' : 'bg-slate-200'
                    }`}
                  />
                )}

                {/* Step Circle */}
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepClick?.(step.id)}
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold transition-all ${
                    isCompleted
                      ? 'bg-primary-600 text-white shadow-sm ring-4 ring-primary-50'
                      : isCurrent
                      ? 'bg-white border-2 border-primary-600 text-primary-700 shadow-sm ring-4 ring-primary-100'
                      : 'bg-slate-100 border border-slate-300 text-slate-400'
                  } ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}`}
                >
                  {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : step.id}
                </button>

                {/* Step Label */}
                <div className="mt-2 text-center">
                  <span
                    className={`text-xs font-medium tracking-tight block ${
                      isCurrent
                        ? 'text-primary-900 font-semibold'
                        : isCompleted
                        ? 'text-slate-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="hidden sm:block text-[10px] text-slate-400 mt-0.5">
                      {step.description}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
