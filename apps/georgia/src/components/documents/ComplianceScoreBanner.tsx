import React from 'react';
import type { ComplianceScore } from '@crystal/types';
import { Badge } from '@crystal/ui';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export interface ComplianceScoreBannerProps {
  score: ComplianceScore;
}

export const ComplianceScoreBanner: React.FC<ComplianceScoreBannerProps> = ({ score }) => {
  return (
    <div
      className={`w-full rounded-2xl p-6 border shadow-sm transition-all ${
        score.is_compliant
          ? 'bg-emerald-50/70 border-emerald-200'
          : 'bg-amber-50/70 border-amber-200'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`p-3 rounded-xl shrink-0 ${
              score.is_compliant ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'
            }`}
          >
            {score.is_compliant ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {score.is_compliant
                  ? 'Caregiver is 100% Compliant & Active'
                  : 'Compliance Action Required'}
              </h3>
              <Badge variant={score.is_compliant ? 'success' : 'warning'} size="sm">
                {score.compliance_percentage}% Compliant
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1 max-w-xl">
              {score.is_compliant
                ? 'All required state home care certifications and disclosures are verified. Authorized for client scheduling.'
                : `${score.total_approved} of ${score.total_required} mandatory credential categories are verified. Please resolve pending/missing items below.`}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="sm:w-48 space-y-1.5">
          <div className="flex justify-between text-xs font-semibold text-slate-700">
            <span>Progress</span>
            <span>{score.compliance_percentage}%</span>
          </div>
          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                score.is_compliant ? 'bg-emerald-600' : 'bg-amber-500'
              }`}
              style={{ width: `${score.compliance_percentage}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 text-right">
            {score.total_approved} / {score.total_required} Approved
          </div>
        </div>
      </div>
    </div>
  );
};
