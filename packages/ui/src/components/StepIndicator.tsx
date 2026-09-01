'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export interface StepIndicatorProps {
  /** Ordered list of step labels */
  steps: string[];
  /** 1-indexed current step number */
  currentStep: number;
  /** 1-indexed list of completed step numbers */
  completedSteps: number[];
  className?: string;
}

/**
 * Horizontal step progress indicator with connecting lines.
 * On mobile, only the current step label is shown to avoid overflow.
 */
export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
  className,
}: StepIndicatorProps) {
  const isCompleted = (stepIndex: number) => completedSteps.includes(stepIndex + 1);
  const isCurrent = (stepIndex: number) => currentStep === stepIndex + 1;

  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex items-start">
        {steps.map((label, index) => {
          const completed = isCompleted(index);
          const current = isCurrent(index);
          const isLast = index === steps.length - 1;

          return (
            <li key={label} className={cn('flex flex-col items-center', isLast ? 'flex-none' : 'flex-1')}>
              {/* Dot + connecting line row */}
              <div className="flex items-center w-full">
                {/* Circle */}
                <div
                  aria-current={current ? 'step' : undefined}
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    completed
                      ? 'border-primary bg-primary text-white'
                      : current
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  )}
                >
                  {completed ? (
                    <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Connecting line — hidden on last step */}
                {!isLast && (
                  <div
                    className={cn(
                      'h-0.5 flex-1 transition-colors',
                      completed ? 'bg-primary' : 'bg-gray-200'
                    )}
                  />
                )}
              </div>

              {/* Step label — hidden on mobile for non-current steps */}
              <span
                className={cn(
                  'mt-2 max-w-[5rem] text-center text-xs font-medium leading-tight',
                  current ? 'text-primary' : completed ? 'text-gray-600' : 'text-gray-400',
                  !current && 'hidden sm:block'
                )}
              >
                {label}
              </span>
              {/* Mobile: always show current label */}
              {current && (
                <span className="mt-2 block text-center text-xs font-semibold text-primary sm:hidden">
                  {label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
