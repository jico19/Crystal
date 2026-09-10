import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Briefcase,
  Users,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Building,
  UserCheck,
  Phone,
  Calendar,
  Mail,
} from 'lucide-react';
import { ExperienceStepSchema, type ExperienceStepInput } from '@crystal/validation';

export interface Step3ExperienceReferencesProps {
  initialValues?: Partial<ExperienceStepInput>;
  onSuccess: (data: ExperienceStepInput) => void;
  onAutosave?: (data: Partial<ExperienceStepInput>) => void;
  onBack: () => void;
}

export const Step3ExperienceReferences: React.FC<Step3ExperienceReferencesProps> = ({
  initialValues,
  onSuccess,
  onAutosave,
  onBack,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ExperienceStepInput>({
    resolver: zodResolver(ExperienceStepSchema),
    defaultValues: {
      experience_history: initialValues?.experience_history || [
        {
          employer_name: '',
          job_title: '',
          start_date: '',
          end_date: '',
          reason_for_leaving: '',
          supervisor_contact: '',
        },
      ],
      references: initialValues?.references || [
        {
          name: '',
          relationship: 'supervisor',
          phone: '',
          email: '',
          years_known: 2,
        },
        {
          name: '',
          relationship: 'professional',
          phone: '',
          email: '',
          years_known: 1,
        },
      ],
    },
  });

  // Autosave to session on input change
  React.useEffect(() => {
    const subscription = watch((values) => {
      onAutosave?.(values as Partial<ExperienceStepInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onAutosave]);

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({
    control,
    name: 'experience_history',
  });

  const {
    fields: referenceFields,
    append: appendReference,
    remove: removeReference,
  } = useFieldArray({
    control,
    name: 'references',
  });

  const onSubmit = (data: ExperienceStepInput) => {
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

  const onInvalid = (errors: unknown) => {
    console.warn('Step 3 Validation Errors:', errors);
    setServerError('Please resolve the highlighted validation errors before proceeding.');
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <Briefcase className="w-5 h-5 text-teal-400" />
          <span>Step 3: Experience & References</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Provide your previous caregiving or employment history and at least 2 references for employment verification.
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Section 1: Employment History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Building className="w-4 h-4 text-teal-400" />
            <span>Work History (Min 1 required) *</span>
          </h3>
          <button
            type="button"
            onClick={() =>
              appendExperience({
                employer_name: '',
                job_title: '',
                start_date: '',
                end_date: '',
                reason_for_leaving: '',
                supervisor_contact: '',
              })
            }
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Employer</span>
          </button>
        </div>

        {errors.experience_history?.root && (
          <p className="text-xs text-red-400">{errors.experience_history.root.message}</p>
        )}

        <div className="space-y-4">
          {experienceFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-4 relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Employer #{index + 1}
                </span>
                {experienceFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExperience(index)}
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
                    Employer Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Visiting Angels / Home Instead"
                    disabled={isSubmitting}
                    {...register(`experience_history.${index}.employer_name` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                  {errors.experience_history?.[index]?.employer_name && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.experience_history[index]?.employer_name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Job Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. Caregiver / Certified Aide"
                    disabled={isSubmitting}
                    {...register(`experience_history.${index}.job_title` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                  {errors.experience_history?.[index]?.job_title && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.experience_history[index]?.job_title?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-teal-400" />
                    <span>Start Date *</span>
                  </label>
                  <input
                    type="date"
                    disabled={isSubmitting}
                    {...register(`experience_history.${index}.start_date` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                  {errors.experience_history?.[index]?.start_date && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.experience_history[index]?.start_date?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-teal-400" />
                    <span>End Date (Leave blank if current)</span>
                  </label>
                  <input
                    type="date"
                    disabled={isSubmitting}
                    {...register(`experience_history.${index}.end_date` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                  {errors.experience_history?.[index]?.end_date && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.experience_history[index]?.end_date?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Reason for Leaving
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Relocation / Schedule conflict"
                    disabled={isSubmitting}
                    {...register(`experience_history.${index}.reason_for_leaving` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Supervisor Contact Info
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. John Miller (404-555-0199)"
                    disabled={isSubmitting}
                    {...register(`experience_history.${index}.supervisor_contact` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 2: References */}
      <div className="space-y-4 pt-6 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center space-x-2">
            <Users className="w-4 h-4 text-teal-400" />
            <span>References (Min 2 required) *</span>
          </h3>
          <button
            type="button"
            onClick={() =>
              appendReference({
                name: '',
                relationship: 'professional',
                phone: '',
                email: '',
                years_known: 1,
              })
            }
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Reference</span>
          </button>
        </div>

        {errors.references?.root && (
          <p className="text-xs text-red-400">{errors.references.root.message}</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {referenceFields.map((field, index) => (
            <div
              key={field.id}
              className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 relative"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                  <span>Reference #{index + 1}</span>
                </span>
                {referenceFields.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeReference(index)}
                    className="text-slate-400 hover:text-red-400 text-xs flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="Reference Legal Name"
                  disabled={isSubmitting}
                  {...register(`references.${index}.name` as const)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                />
                {errors.references?.[index]?.name && (
                  <p className="text-[11px] text-red-400 mt-1">
                    {errors.references[index]?.name?.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Relationship *
                  </label>
                  <select
                    disabled={isSubmitting}
                    {...register(`references.${index}.relationship` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-teal-500 text-xs disabled:opacity-50"
                  >
                    <option value="supervisor">Past Supervisor</option>
                    <option value="professional">Professional Coworker</option>
                    <option value="personal">Personal / Character</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Years Known *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    disabled={isSubmitting}
                    {...register(`references.${index}.years_known` as const, { valueAsNumber: true })}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                  {errors.references?.[index]?.years_known && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.references[index]?.years_known?.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-teal-400" />
                    <span>Phone Number *</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="(555) 000-0000"
                    disabled={isSubmitting}
                    {...register(`references.${index}.phone` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                  {errors.references?.[index]?.phone && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.references[index]?.phone?.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
                    <Mail className="w-3 h-3 text-teal-400" />
                    <span>Email Address (Optional)</span>
                  </label>
                  <input
                    type="email"
                    placeholder="ref@example.com"
                    disabled={isSubmitting}
                    {...register(`references.${index}.email` as const)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-400 text-xs disabled:opacity-50"
                  />
                  {errors.references?.[index]?.email && (
                    <p className="text-[11px] text-red-400 mt-1">
                      {errors.references[index]?.email?.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
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
          <span>Back to Step 2</span>
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
              <span>Saving Step 3...</span>
            </>
          ) : (
            <>
              <span>Save & Continue to Step 4</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
