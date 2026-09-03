import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  MapPin,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { PersonalInfoStepSchema, type PersonalInfoStepInput } from '@crystal/validation';
import { useOrgTheme } from '../../../lib/OrgThemeContext.tsx';

export interface Step1PersonalInfoProps {
  initialValues?: Partial<PersonalInfoStepInput>;
  onSuccess: (profileId: string) => void;
}

export const Step1PersonalInfo: React.FC<Step1PersonalInfoProps> = ({
  initialValues,
  onSuccess,
}) => {
  const { org } = useOrgTheme();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [showSsn, setShowSsn] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PersonalInfoStepInput>({
    resolver: zodResolver(PersonalInfoStepSchema),
    defaultValues: {
      first_name: initialValues?.first_name || '',
      middle_name: initialValues?.middle_name || '',
      last_name: initialValues?.last_name || '',
      email: initialValues?.email || '',
      phone: initialValues?.phone || '',
      dob: initialValues?.dob || '',
      ssn: initialValues?.ssn || '',
      address: {
        street: initialValues?.address?.street || '',
        unit: initialValues?.address?.unit || '',
        city: initialValues?.address?.city || '',
        state: initialValues?.address?.state || org?.state_code || 'IN',
        zip: initialValues?.address?.zip || '',
      },
    },
  });

  const rawSsn = watch('ssn') || '';

  // Auto-format SSN as user types: 000-00-0000
  const handleSsnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 9) val = val.slice(0, 9);
    let formatted = val;
    if (val.length > 5) {
      formatted = `${val.slice(0, 3)}-${val.slice(3, 5)}-${val.slice(5)}`;
    } else if (val.length > 3) {
      formatted = `${val.slice(0, 3)}-${val.slice(3)}`;
    }
    setValue('ssn', formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: PersonalInfoStepInput) => {
    try {
      setIsSubmitting(true);
      setServerError(null);

      if (!org) {
        throw new Error('Organization context not loaded');
      }

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      
      let token = localStorage.getItem('crystal_jwt');
      if (!token) {
        token = 'dev-applicant-token';
      }

      const response = await fetch(`${apiUrl}/api/v1/caregivers/application`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          org_id: org.id,
          state_code: org.state_code,
          personal_info: data,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        if (json.fieldErrors) {
          const firstField = Object.keys(json.fieldErrors)[0];
          throw new Error(json.fieldErrors[firstField][0]);
        }
        throw new Error(json.error || 'Failed to save application draft');
      }

      const profileId = json.data?.profileId;
      if (profileId) {
        localStorage.setItem('caregiver_profile_id', profileId);
      }

      onSuccess(profileId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center space-x-2">
          <User className="w-5 h-5 text-blue-400" />
          <span>Step 1: Personal Information</span>
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Please provide your legal name and contact details for state regulatory credentialing.
        </p>
      </div>

      {serverError && (
        <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      {/* Legal Name Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">First Name *</label>
          <input
            type="text"
            placeholder="Jane"
            disabled={isSubmitting}
            {...register('first_name')}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
          />
          {errors.first_name && (
            <p className="text-xs text-red-400 mt-1">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Middle Name</label>
          <input
            type="text"
            placeholder="Marie (optional)"
            disabled={isSubmitting}
            {...register('middle_name')}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
          />
          {errors.middle_name && (
            <p className="text-xs text-red-400 mt-1">{errors.middle_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">Last Name *</label>
          <input
            type="text"
            placeholder="Doe"
            disabled={isSubmitting}
            {...register('last_name')}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
          />
          {errors.last_name && (
            <p className="text-xs text-red-400 mt-1">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      {/* Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
            <Mail className="w-3.5 h-3.5 text-blue-400" />
            <span>Email Address *</span>
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            disabled={isSubmitting}
            {...register('email')}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
            <Phone className="w-3.5 h-3.5 text-blue-400" />
            <span>Phone Number *</span>
          </label>
          <input
            type="tel"
            placeholder="(317) 555-0123"
            disabled={isSubmitting}
            {...register('phone')}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
          />
          {errors.phone && (
            <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* DOB & SSN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Date of Birth (Must be 18+) *</span>
          </label>
          <input
            type="date"
            disabled={isSubmitting}
            {...register('dob')}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
          />
          {errors.dob && (
            <p className="text-xs text-red-400 mt-1">{errors.dob.message}</p>
          )}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Social Security Number (SSN) *</span>
            </label>
            <button
              type="button"
              onClick={() => setShowSsn(!showSsn)}
              className="text-[11px] text-slate-400 hover:text-blue-400 flex items-center space-x-1 cursor-pointer"
            >
              {showSsn ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{showSsn ? 'Mask' : 'Show'}</span>
            </button>
          </div>
          <input
            type={showSsn ? 'text' : 'password'}
            placeholder="000-00-0000"
            value={rawSsn}
            onChange={handleSsnChange}
            disabled={isSubmitting}
            maxLength={11}
            className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50 tracking-wider font-mono"
          />
          <span className="text-[10px] text-slate-500 block mt-1">
            Encrypted in transit. Only the last 4 digits are retained for compliance verification.
          </span>
          {errors.ssn && (
            <p className="text-xs text-red-400 mt-1">{errors.ssn.message}</p>
          )}
        </div>
      </div>

      {/* Residential Address */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center space-x-1.5">
          <MapPin className="w-4 h-4 text-blue-400" />
          <span>Home Address</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-300 mb-1">Street Address *</label>
            <input
              type="text"
              placeholder="123 Main Street"
              disabled={isSubmitting}
              {...register('address.street')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
            />
            {errors.address?.street && (
              <p className="text-xs text-red-400 mt-1">{errors.address.street.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Apt / Unit</label>
            <input
              type="text"
              placeholder="Apt 4B (optional)"
              disabled={isSubmitting}
              {...register('address.unit')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">City *</label>
            <input
              type="text"
              placeholder="Indianapolis"
              disabled={isSubmitting}
              {...register('address.city')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
            />
            {errors.address?.city && (
              <p className="text-xs text-red-400 mt-1">{errors.address.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">State *</label>
            <input
              type="text"
              placeholder="IN"
              maxLength={2}
              disabled={isSubmitting}
              {...register('address.state')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm uppercase disabled:opacity-50"
            />
            {errors.address?.state && (
              <p className="text-xs text-red-400 mt-1">{errors.address.state.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">ZIP Code *</label>
            <input
              type="text"
              placeholder="46225"
              disabled={isSubmitting}
              {...register('address.zip')}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 text-sm disabled:opacity-50"
            />
            {errors.address?.zip && (
              <p className="text-xs text-red-400 mt-1">{errors.address.zip.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action Advance Button */}
      <div className="pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          style={{ backgroundColor: 'var(--primary, #1E3A8A)' }}
          className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg text-white font-semibold text-sm hover:brightness-110 transition-all shadow-md disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Saving Step 1...</span>
            </>
          ) : (
            <>
              <span>Save & Continue to Step 2</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </form>
  );
};
