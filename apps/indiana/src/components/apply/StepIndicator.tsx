import React from 'react';
import { Check, User, Calendar, Briefcase, Award, FileCheck } from 'lucide-react';

export interface StepIndicatorProps {
  currentStep: number;
  completedSteps: number[];
  onStepSelect?: (step: number) => void;
}

const STEPS = [
  { step: 1, label: 'Personal Info', icon: User },
  { step: 2, label: 'Availability & Roles', icon: Calendar },
  { step: 3, label: 'Experience & References', icon: Briefcase },
  { step: 4, label: 'Licensure', icon: Award },
  { step: 5, label: 'Attestation', icon: FileCheck },
];

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
  onStepSelect,
}) => {
  return (
    <nav aria-label="Application Progress" className="w-full py-6">
      <ol className="flex items-center justify-between max-w-4xl mx-auto px-4">
        {STEPS.map((item, index) => {
          const isCompleted = completedSteps.includes(item.step);
          const isCurrent = currentStep === item.step;
          const isClickable = isCompleted && onStepSelect;
          const Icon = item.icon;

          return (
            <li
              key={item.step}
              className={`flex items-center ${index !== STEPS.length - 1 ? 'flex-1' : ''}`}
            >
              <div className="flex flex-col items-center group">
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && onStepSelect(item.step)}
                  style={
                    isCurrent
                      ? {
                          backgroundColor: 'var(--primary, #1E3A8A)',
                          borderColor: 'var(--primary, #1E3A8A)',
                        }
                      : {}
                  }
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 cursor-pointer hover:bg-emerald-500/30'
                      : isCurrent
                      ? 'text-white ring-4 ring-blue-500/20 shadow-lg'
                      : 'border-slate-700 bg-slate-900 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </button>

                <span
                  className={`mt-2 text-xs font-medium text-center hidden sm:block max-w-[100px] leading-tight ${
                    isCurrent
                      ? 'text-blue-400 font-semibold'
                      : isCompleted
                      ? 'text-slate-300'
                      : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Connecting Progress Line */}
              {index !== STEPS.length - 1 && (
                <div className="flex-1 mx-2 sm:mx-4 h-0.5 bg-slate-800 self-start mt-5">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: isCompleted ? '100%' : '0%',
                      backgroundColor: 'var(--primary, #1E3A8A)',
                    }}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
