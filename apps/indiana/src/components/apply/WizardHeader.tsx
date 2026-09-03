import React from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Loader2, HeartHandshake } from 'lucide-react';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';

export interface WizardHeaderProps {
  currentStep: number;
  totalSteps?: number;
  onSaveAndExit: () => Promise<void>;
  isSaving?: boolean;
}

export const WizardHeader: React.FC<WizardHeaderProps> = ({
  currentStep,
  totalSteps = 5,
  onSaveAndExit,
  isSaving = false,
}) => {
  const { org } = useOrgTheme();
  const percentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center space-x-2.5">
          {org?.branding_theme?.logo_url ? (
            <img src={org.branding_theme.logo_url} alt={org.name} className="h-8 w-auto" />
          ) : (
            <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
              <HeartHandshake className="w-5 h-5" />
            </div>
          )}
          <div>
            <span className="font-bold text-sm tracking-tight block text-white leading-tight">
              {org?.name || 'Caregiver Portal'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Application Wizard
            </span>
          </div>
        </Link>

        {/* Step Counter & Progress Indicator */}
        <div className="flex flex-col items-center w-48 sm:w-64">
          <div className="flex justify-between w-full text-[11px] font-semibold text-slate-300 mb-1">
            <span>Step {currentStep} of {totalSteps}</span>
            <span className="text-blue-400">{percentage}% Complete</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${percentage}%`,
                backgroundColor: 'var(--primary, #1E3A8A)',
              }}
            />
          </div>
        </div>

        {/* Save & Exit Button */}
        <button
          type="button"
          onClick={onSaveAndExit}
          disabled={isSaving}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer border border-slate-700"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <LogOut className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Save & Exit</span>
              <span className="sm:hidden">Exit</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
