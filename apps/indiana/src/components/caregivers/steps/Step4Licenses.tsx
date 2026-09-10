import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Award,
  Plus,
  Trash2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { LicensesStepSchema, type LicensesStepInput } from '@crystal/validation';
import { useOrgTheme } from '../../../lib/OrgThemeContext.tsx';

export interface Step4LicensesProps {
  initialValues?: Partial<LicensesStepInput>;
  onSuccess: (data: LicensesStepInput) => void;
  onAutosave?: (data: Partial<LicensesStepInput>) => void;
  onBack: () => void;
}

const LICENSE_TYPES = [
  { id: 'CNA', label: 'Certified Nursing Assistant (CNA)' },
  { id: 'HHA', label: 'Home Health Aide (HHA)' },
  { id: 'CPR', label: 'CPR / Basic Life Support (BLS)' },
  { id: 'PCA', label: 'Personal Care Assistant (PCA)' },
  { id: 'LPN', label: 'Licensed Practical Nurse (LPN)' },
  { id: 'RN', label: 'Registered Nurse (RN)' },
] as const;

export const Step4Licenses: React.FC<Step4LicensesProps> = ({
  initialValues,
  onSuccess,
  onAutosave,
  onBack,
}) => {
  const { org } = useOrgTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [noLicenses, setNoLicenses] = useState<boolean>(
    initialValues?.professional_licenses?.length === 0
  );

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LicensesStepInput>({
    resolver: zodResolver(LicensesStepSchema),
    defaultValues: {
      professional_licenses: initialValues?.professional_licenses || [
        {
          license_type: 'CNA',
          license_number: '',
          issuing_state: org?.state_code || 'IN',
          expiration_date: '',
        },
      ],
    },
  });

  // Autosave to session on input change
  React.useEffect(() => {
    const subscription = watch((values) => {
      onAutosave?.(values as Partial<LicensesStepInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onAutosave]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'professional_licenses',
  });

  const licensesWatch = watch('professional_licenses') || [];

  const handleToggleNoLicenses = (checked: boolean) => {
    setNoLicenses(checked);
    if (checked) {
      setValue('professional_licenses', []);
    } else {
      setValue('professional_licenses', [
        {
          license_type: 'CNA',
          license_number: '',
          issuing_state: org?.state_code || 'IN',
          expiration_date: '',
        },
      ]);
    }
  };

  const isExpired = (expiryDate: string): boolean => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return exp < today;
  };

  const onSubmit = (data: LicensesStepInput) => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      onSuccess(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Award className="w-5 h-5 text-teal-400" />
          <span>Step 4: Professional Licenses & Certifications</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Provide your healthcare licenses or certifications. If applying as an unlicensed companion or homemaker, you may check the exemption below.
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* No License Checkbox Option */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start space-x-3">
        <input
          type="checkbox"
          id="noLicensesCheckbox"
          checked={noLicenses}
          onChange={(e) => handleToggleNoLicenses(e.target.checked)}
          className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4 mt-0.5"
        />
        <label htmlFor="noLicensesCheckbox" className="text-xs text-slate-300 cursor-pointer">
          <strong className="text-white block font-semibold">
            I do not currently hold any professional medical licenses or state certifications.
          </strong>
          <span className="text-slate-400 text-[11px] block mt-0.5">
            Check this box if you are applying for non-medical positions such as Companion, Homemaker, or entry-level Personal Care Assistant.
          </span>
        </label>
      </div>

      {!noLicenses && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span>Active Licenses / Certifications</span>
            </h3>
            <button
              type="button"
              onClick={() =>
                append({
                  license_type: 'CPR',
                  license_number: '',
                  issuing_state: org?.state_code || 'IN',
                  expiration_date: '',
                })
              }
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add License</span>
            </button>
          </div>

          <div className="space-y-4">
            {fields.map((field, index) => {
              const currentExpiry = licensesWatch[index]?.expiration_date || '';
              const expired = isExpired(currentExpiry);

              return (
                <div
                  key={field.id}
                  className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 relative"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                      <Award className="w-3.5 h-3.5 text-teal-400" />
                      <span>License / Certification #{index + 1}</span>
                    </span>
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-slate-400 hover:text-red-400 text-xs flex items-center space-x-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        License / Credential Type *
                      </label>
                      <select
                        disabled={isSubmitting}
                        {...register(`professional_licenses.${index}.license_type` as const)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 text-xs disabled:opacity-50"
                      >
                        {LICENSE_TYPES.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        License / Certification Number *
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. CNA-1098452"
                        disabled={isSubmitting}
                        {...register(`professional_licenses.${index}.license_number` as const)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                      />
                      {errors.professional_licenses?.[index]?.license_number && (
                        <p className="text-[11px] text-red-400 mt-1">
                          {errors.professional_licenses[index]?.license_number?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        Issuing State *
                      </label>
                      <input
                        type="text"
                        placeholder="IN"
                        maxLength={2}
                        disabled={isSubmitting}
                        {...register(`professional_licenses.${index}.issuing_state` as const)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs uppercase disabled:opacity-50"
                      />
                      {errors.professional_licenses?.[index]?.issuing_state && (
                        <p className="text-[11px] text-red-400 mt-1">
                          {errors.professional_licenses[index]?.issuing_state?.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-teal-400" />
                        <span>Expiration Date *</span>
                      </label>
                      <input
                        type="date"
                        disabled={isSubmitting}
                        {...register(`professional_licenses.${index}.expiration_date` as const)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                      />
                      {errors.professional_licenses?.[index]?.expiration_date && (
                        <p className="text-[11px] text-red-400 mt-1">
                          {errors.professional_licenses[index]?.expiration_date?.message}
                        </p>
                      )}
                      {expired && (
                        <div className="flex items-center space-x-1 mt-1 text-[11px] text-amber-400">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span>Warning: This license appears to be expired.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Nav Actions */}
      <div className="pt-6 flex justify-between items-center border-t border-slate-800">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Step 3</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: 'var(--primary, #0F766E)' }}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold text-sm hover:brightness-110 transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Saving Step 4...</span>
            </>
          ) : (
            <>
              <span>Save & Continue to Step 5</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
