import React from 'react';
import { ShieldCheck } from 'lucide-react';

export interface ESIGNConsentCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  signerName?: string;
}

export const ESIGNConsentCheckbox: React.FC<ESIGNConsentCheckboxProps> = ({
  checked,
  onChange,
  signerName,
}) => {
  return (
    <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-neutral-800 uppercase tracking-wider">
        <ShieldCheck className="w-4 h-4 text-emerald-600" />
        Electronic Signature & Record Consent (E-SIGN Act 15 U.S.C. § 7001)
      </div>

      <p className="text-[11px] text-neutral-500 leading-relaxed">
        By checking the box below, you consent to electronically sign this document and agree that your electronic signature, whether typed or drawn, is the legal equivalent of your manual wet-ink signature. You understand that this record will be cryptographically hashed (SHA-256) and logged with your IP address and timestamp for tamper-evident compliance.
      </p>

      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
        />
        <span className="text-xs font-semibold text-neutral-800">
          I, {signerName || 'the undersigned'}, agree to conduct business electronically and adopt this electronic signature as my legally binding signature.
        </span>
      </label>
    </div>
  );
};
