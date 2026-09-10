import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calendar,
  Clock,
  Compass,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  Home,
  Check,
} from 'lucide-react';
import { AvailabilityStepSchema, type AvailabilityStepInput } from '@crystal/validation';

export interface Step2AvailabilityProps {
  initialValues?: Partial<AvailabilityStepInput>;
  onSuccess: (data: AvailabilityStepInput) => void;
  onAutosave?: (data: Partial<AvailabilityStepInput>) => void;
  onBack: () => void;
}

const POSITIONS = [
  { id: 'cna', title: 'Certified Nursing Assistant (CNA)', desc: 'Skilled personal & medical care assistance' },
  { id: 'hha', title: 'Home Health Aide (HHA)', desc: 'Routine health tasks & daily personal care' },
  { id: 'pca', title: 'Personal Care Assistant (PCA)', desc: 'Bathing, dressing, grooming & mobility' },
  { id: 'companion', title: 'Companion & Homemaker', desc: 'Companionship, meal prep & light housekeeping' },
  { id: 'lpn', title: 'Licensed Practical Nurse (LPN)', desc: 'Medication administration & clinical care' },
  { id: 'rn', title: 'Registered Nurse (RN)', desc: 'Assessments, care planning & complex clinical care' },
] as const;

const DAYS = [
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
] as const;

const SHIFTS = [
  { id: 'mornings', label: 'Mornings (7am - 12pm)', icon: Sun },
  { id: 'afternoons', label: 'Afternoons (12pm - 5pm)', icon: Sun },
  { id: 'evenings', label: 'Evenings (5pm - 10pm)', icon: Sunset },
  { id: 'overnights', label: 'Overnights (10pm - 7am)', icon: Moon },
  { id: 'live_in', label: 'Live-In Shifts (24hr)', icon: Home },
] as const;

export const Step2Availability: React.FC<Step2AvailabilityProps> = ({
  initialValues,
  onSuccess,
  onAutosave,
  onBack,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<AvailabilityStepInput>({
    resolver: zodResolver(AvailabilityStepSchema),
    defaultValues: {
      positions_applied: initialValues?.positions_applied || ['pca'],
      availability: {
        full_time: initialValues?.availability?.full_time ?? true,
        part_time: initialValues?.availability?.part_time ?? false,
        prn: initialValues?.availability?.prn ?? false,
        days_available: initialValues?.availability?.days_available || ['mon', 'tue', 'wed', 'thu', 'fri'],
        shifts_available: initialValues?.availability?.shifts_available || ['mornings', 'afternoons'],
        max_weekly_hours: initialValues?.availability?.max_weekly_hours ?? 40,
        willing_to_travel_miles: initialValues?.availability?.willing_to_travel_miles ?? 25,
      },
    },
  });

  // Autosave to session on input change
  React.useEffect(() => {
    const subscription = watch((values) => {
      onAutosave?.(values as Partial<AvailabilityStepInput>);
    });
    return () => subscription.unsubscribe();
  }, [watch, onAutosave]);

  const travelMiles = watch('availability.willing_to_travel_miles');
  const maxHours = watch('availability.max_weekly_hours');

  const onSubmit = (data: AvailabilityStepInput) => {
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
          <Calendar className="w-5 h-5 text-teal-400" />
          <span>Step 2: Availability & Positions Applied</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Select the caregiving roles you are applying for and configure your ideal working schedule.
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Target Roles Selection */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Briefcase className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Target Position(s) Applied *</h3>
        </div>
        <p className="text-xs text-slate-400">Select all roles you are certified or experienced to perform.</p>

        <Controller
          name="positions_applied"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {POSITIONS.map((pos) => {
                const isSelected = field.value?.includes(pos.id as any);
                return (
                  <button
                    type="button"
                    key={pos.id}
                    onClick={() => {
                      if (isSelected) {
                        field.onChange(field.value.filter((v: string) => v !== pos.id));
                      } else {
                        field.onChange([...(field.value || []), pos.id]);
                      }
                    }}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-start space-x-3 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-white ring-1 ring-teal-500'
                        : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                        isSelected
                          ? 'bg-teal-600 border-teal-500 text-white'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <span className="font-semibold text-xs block text-white">{pos.title}</span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">{pos.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.positions_applied && (
          <p className="text-xs text-red-400">{errors.positions_applied.message}</p>
        )}
      </div>

      {/* Employment Type */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-white">Employment Type Preference</h3>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              {...register('availability.full_time')}
              className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <span>Full-Time (32+ hrs/wk)</span>
          </label>
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              {...register('availability.part_time')}
              className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <span>Part-Time (&lt;32 hrs/wk)</span>
          </label>
          <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              {...register('availability.prn')}
              className="rounded bg-slate-800 border-slate-700 text-teal-600 focus:ring-teal-500 w-4 h-4"
            />
            <span>PRN / As-Needed</span>
          </label>
        </div>
      </div>

      {/* Available Days */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Available Working Days *</h3>
        </div>

        <Controller
          name="availability.days_available"
          control={control}
          render={({ field }) => (
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => {
                const isSelected = field.value?.includes(d.id as any);
                return (
                  <button
                    type="button"
                    key={d.id}
                    onClick={() => {
                      if (isSelected) {
                        field.onChange(field.value.filter((v: string) => v !== d.id));
                      } else {
                        field.onChange([...(field.value || []), d.id]);
                      }
                    }}
                    className={`w-12 h-10 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/20 text-teal-300 ring-1 ring-teal-500'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.availability?.days_available && (
          <p className="text-xs text-red-400">{errors.availability.days_available.message}</p>
        )}
      </div>

      {/* Shift Preferences */}
      <div className="space-y-3 pt-4 border-t border-slate-800">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-teal-400" />
          <h3 className="text-sm font-semibold text-white">Available Shifts *</h3>
        </div>

        <Controller
          name="availability.shifts_available"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SHIFTS.map((sh) => {
                const isSelected = field.value?.includes(sh.id as any);
                const Icon = sh.icon;
                return (
                  <button
                    type="button"
                    key={sh.id}
                    onClick={() => {
                      if (isSelected) {
                        field.onChange(field.value.filter((v: string) => v !== sh.id));
                      } else {
                        field.onChange([...(field.value || []), sh.id]);
                      }
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer flex items-center space-x-2.5 ${
                      isSelected
                        ? 'border-teal-500 bg-teal-500/10 text-white ring-1 ring-teal-500'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-teal-400 shrink-0" />
                    <span className="text-xs font-medium">{sh.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.availability?.shifts_available && (
          <p className="text-xs text-red-400">{errors.availability.shifts_available.message}</p>
        )}
      </div>

      {/* Sliders Grid: Travel Radius & Max Weekly Hours */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Compass className="w-3.5 h-3.5 text-teal-400" />
              <span>Travel Radius:</span>
            </label>
            <span className="text-xs font-bold text-teal-400">{travelMiles} miles</span>
          </div>
          <input
            type="range"
            min={5}
            max={100}
            step={5}
            {...register('availability.willing_to_travel_miles', { valueAsNumber: true })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>5 mi</span>
            <span>50 mi</span>
            <span>100 mi</span>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span>Max Weekly Hours:</span>
            </label>
            <span className="text-xs font-bold text-teal-400">{maxHours} hrs/wk</span>
          </div>
          <input
            type="range"
            min={10}
            max={80}
            step={5}
            {...register('availability.max_weekly_hours', { valueAsNumber: true })}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>10 hrs</span>
            <span>40 hrs</span>
            <span>80 hrs</span>
          </div>
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
          <span>Back to Step 1</span>
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
              <span>Saving Step 2...</span>
            </>
          ) : (
            <>
              <span>Save & Continue to Step 3</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
