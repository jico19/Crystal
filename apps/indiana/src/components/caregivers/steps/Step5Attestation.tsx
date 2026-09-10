import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FileCheck,
  ShieldCheck,
  AlertCircle,
  PenTool,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Calendar,
} from 'lucide-react';
import { LegalDisclosuresStepSchema, type LegalDisclosuresStepInput } from '@crystal/validation';

export interface Step5AttestationProps {
  initialValues?: Partial<LegalDisclosuresStepInput>;
  onSuccess: (data: LegalDisclosuresStepInput) => void;
  onAutosave?: (data: Partial<LegalDisclosuresStepInput>) => void;
  onBack: () => void;
  isSubmitting?: boolean;
}

export const Step5Attestation: React.FC<Step5AttestationProps> = ({
  initialValues,
  onSuccess,
  onAutosave,
  onBack,
  isSubmitting = false,
}) => {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<LegalDisclosuresStepInput>({
    resolver: zodResolver(LegalDisclosuresStepSchema),
    defaultValues: {
      authorized_to_work_in_us: initialValues?.authorized_to_work_in_us ?? (true as any),
      felony_conviction: initialValues?.felony_conviction ?? false,
      felony_explanation: initialValues?.felony_explanation || '',
      drug_screen_consent: initialValues?.drug_screen_consent ?? (true as any),
      background_check_consent: initialValues?.background_check_consent ?? (true as any),
      attestation_signature: initialValues?.attestation_signature || '',
      attestation_timestamp: new Date().toISOString(),
    },
  });

  // Autosave to session on input change
  React.useEffect(() => {
    const subscription = watch((values) => {
      onAutosave?.(values as Partial<LegalDisclosuresStepInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onAutosave]);

  const hasFelony = watch('felony_conviction');
  const typedSignature = watch('attestation_signature');

  const onSubmit = (data: LegalDisclosuresStepInput) => {
    setServerError(null);
    onSuccess(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <FileCheck className="w-5 h-5 text-teal-400" />
          <span>Step 5: Legal Disclosures & Attestation</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Review state-mandated disclosures, provide consent for required pre-employment screenings, and sign below.
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Mandatory Consents Stack */}
      <div className="space-y-4">
        {/* US Work Authorization */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
          <input
            type="checkbox"
            id="workAuthCheckbox"
            disabled={isSubmitting}
            {...register('authorized_to_work_in_us')}
            className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4 mt-1"
          />
          <label htmlFor="workAuthCheckbox" className="text-xs text-slate-300 cursor-pointer">
            <strong className="text-white block font-semibold">
              U.S. Employment Authorization *
            </strong>
            <span className="text-slate-400 text-[11px] block mt-0.5">
              I certify that I am legally authorized to work in the United States and understand that proof of identity and employment eligibility (Form I-9) will be required upon hire.
            </span>
            {errors.authorized_to_work_in_us && (
              <span className="text-red-400 text-xs block mt-1">
                {errors.authorized_to_work_in_us.message}
              </span>
            )}
          </label>
        </div>

        {/* Background Check & Motor Vehicle Records Consent */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
          <input
            type="checkbox"
            id="backgroundCheckCheckbox"
            disabled={isSubmitting}
            {...register('background_check_consent')}
            className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4 mt-1"
          />
          <label htmlFor="backgroundCheckCheckbox" className="text-xs text-slate-300 cursor-pointer">
            <strong className="text-white block font-semibold flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Criminal Background Check & MVR Consent *</span>
            </strong>
            <span className="text-slate-400 text-[11px] block mt-0.5">
              I authorize the company to conduct comprehensive background checks including state and FBI fingerprint checks, sex offender registry checks, and motor vehicle driving history as required by state health regulations.
            </span>
            {errors.background_check_consent && (
              <span className="text-red-400 text-xs block mt-1">
                {errors.background_check_consent.message}
              </span>
            )}
          </label>
        </div>

        {/* Drug Screen Policy Consent */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
          <input
            type="checkbox"
            id="drugScreenCheckbox"
            disabled={isSubmitting}
            {...register('drug_screen_consent')}
            className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4 mt-1"
          />
          <label htmlFor="drugScreenCheckbox" className="text-xs text-slate-300 cursor-pointer">
            <strong className="text-white block font-semibold">
              Pre-Employment Drug Screening Policy *
            </strong>
            <span className="text-slate-400 text-[11px] block mt-0.5">
              I consent to submit to a pre-employment drug screening as a condition of employment and understand that a positive test result or refusal to test may disqualify me from hire.
            </span>
            {errors.drug_screen_consent && (
              <span className="text-red-400 text-xs block mt-1">
                {errors.drug_screen_consent.message}
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Criminal History Disclosure */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-semibold text-white">Criminal History Disclosure</h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Have you ever been convicted of, pleaded guilty or nolo contendere to, or received deferred adjudication for a felony offense?
        </p>

        <div className="flex space-x-6">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="radio"
              value="false"
              checked={!hasFelony}
              disabled={isSubmitting}
              {...register('felony_conviction', {
                setValueAs: (v) => v === 'true' || v === true,
              })}
              className="text-teal-600 focus:ring-teal-500 w-4 h-4 bg-slate-800 border-slate-700"
            />
            <span className="font-medium text-slate-200">No</span>
          </label>

          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="radio"
              value="true"
              checked={hasFelony}
              disabled={isSubmitting}
              {...register('felony_conviction', {
                setValueAs: (v) => v === 'true' || v === true,
              })}
              className="text-teal-600 focus:ring-teal-500 w-4 h-4 bg-slate-800 border-slate-700"
            />
            <span className="font-medium text-slate-200">Yes</span>
          </label>
        </div>

        {hasFelony && (
          <div className="pt-2">
            <label className="block text-xs font-semibold text-amber-400 mb-1.5">
              Please provide details (nature of offense, date, county/state, and outcome) *
            </label>
            <textarea
              rows={3}
              placeholder="Provide full disclosure explanation..."
              disabled={isSubmitting}
              {...register('felony_explanation')}
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-amber-500/40 text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 text-xs disabled:opacity-50"
            />
            {errors.felony_explanation && (
              <p className="text-xs text-red-400 mt-1">{errors.felony_explanation.message}</p>
            )}
          </div>
        )}
      </div>

      {/* Digital Legal Signature Box */}
      <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <PenTool className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Digital Attestation & Legal Signature</h3>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          By typing your full legal name below, you certify under penalty of perjury that all statements in this application are true and complete. You understand that false or misleading statements may result in disqualification or termination.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Type Full Legal Name (Signature) *
            </label>
            <input
              type="text"
              placeholder="e.g. Jane Marie Doe"
              disabled={isSubmitting}
              {...register('attestation_signature')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-sm font-serif italic disabled:opacity-50 tracking-wide"
            />
            {errors.attestation_signature && (
              <p className="text-xs text-red-400 mt-1">{errors.attestation_signature.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-teal-400" />
              <span>Date</span>
            </label>
            <input
              type="text"
              disabled
              value={new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 text-sm font-mono cursor-not-allowed"
            />
          </div>
        </div>

        {typedSignature && (
          <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-300 font-serif italic">
            Signed digitally: &quot;{typedSignature}&quot;
          </div>
        )}
      </div>

      {/* Nav Actions */}
      <div className="pt-6 flex justify-between items-center border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 4</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: 'var(--primary, #0F766E)' }}
          className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-xl text-white font-bold text-sm hover:brightness-110 transition-all shadow-xl disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Submitting Application...</span>
            </>
          ) : (
            <>
              <span>Submit Final Application</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
