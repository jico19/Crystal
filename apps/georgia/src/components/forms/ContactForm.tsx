import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Send, AlertCircle, Loader2, User, Mail, Phone, MessageSquare, RotateCcw } from 'lucide-react';
import { CreatePublicInquirySchema, type CreatePublicInquiryInput } from '@crystal/validation';
import { useOrgTheme } from '../../lib/OrgThemeContext.tsx';
import { useSubmitInquiry } from '../../hooks/useSubmitInquiry.ts';

export interface ContactFormProps {
  defaultInquiryType?: 'caregiver_inquiry' | 'client_care_inquiry' | 'general_question';
  onSuccessCallback?: (inquiryId: string) => void;
  className?: string;
}

type FormFields = Omit<CreatePublicInquiryInput, 'org_id' | 'state_code' | 'source_url'>;

export const ContactForm: React.FC<ContactFormProps> = ({
  defaultInquiryType = 'general_question',
  onSuccessCallback,
  className = '',
}) => {
  const { org } = useOrgTheme();
  const { submitInquiry, isSubmitting, isSuccess, isError, error, reset: resetStatus } = useSubmitInquiry();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<FormFields>({
    resolver: zodResolver(
      CreatePublicInquirySchema.omit({
        org_id: true,
        state_code: true,
        source_url: true,
      })
    ),
    defaultValues: {
      inquiry_type: defaultInquiryType,
      full_name: '',
      email: '',
      phone: '',
      message: '',
      honeypot: '',
    },
  });

  const onSubmit = async (data: FormFields) => {
    if (!org) {
      console.error('[ContactForm Error] Organization theme context not loaded');
      return;
    }

    const payload: CreatePublicInquiryInput = {
      ...data,
      org_id: org.id,
      state_code: org.state_code,
      source_url: window.location.href,
    };

    await submitInquiry(payload);
    if (onSuccessCallback) {
      onSuccessCallback(org.id);
    }
  };

  const handleReset = () => {
    resetForm();
    resetStatus();
  };

  if (isSuccess) {
    return (
      <div className={`p-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4 ${className}`}>
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white">Thank You!</h3>
        <p className="text-sm text-slate-300">
          Your inquiry has been received. A representative from <span className="font-semibold text-white">{org?.name || 'our team'}</span> will get back to you shortly.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="mt-2 inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Send another message</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`space-y-4 ${className}`}>
      {isError && (
        <div className="p-3 rounded bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error || 'Submission failed. Please check your information and try again.'}</span>
        </div>
      )}

      {/* Hidden Anti-Spam Honeypot Field */}
      <input
        type="text"
        {...register('honeypot')}
        tabIndex={-1}
        autoComplete="off"
        className="opacity-0 absolute -z-10 pointer-events-none w-0 h-0"
      />

      {/* Full Name */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
          <User className="w-3.5 h-3.5 text-teal-400" />
          <span>Full Name *</span>
        </label>
        <input
          type="text"
          placeholder="Jane Doe"
          disabled={isSubmitting}
          {...register('full_name')}
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm disabled:opacity-50"
        />
        {errors.full_name && (
          <p className="text-xs text-red-400 mt-1">{errors.full_name.message}</p>
        )}
      </div>

      {/* Email & Phone Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            <span>Email Address *</span>
          </label>
          <input
            type="email"
            placeholder="jane@example.com"
            disabled={isSubmitting}
            {...register('email')}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm disabled:opacity-50"
          />
          {errors.email && (
            <p className="text-xs text-red-400 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
            <Phone className="w-3.5 h-3.5 text-teal-400" />
            <span>Phone Number *</span>
          </label>
          <input
            type="tel"
            placeholder="(555) 234-5678"
            disabled={isSubmitting}
            {...register('phone')}
            className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm disabled:opacity-50"
          />
          {errors.phone && (
            <p className="text-xs text-red-400 mt-1">{errors.phone.message}</p>
          )}
        </div>
      </div>

      {/* Inquiry Type */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center space-x-1">
          <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
          <span>Inquiry Type *</span>
        </label>
        <select
          disabled={isSubmitting}
          {...register('inquiry_type')}
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-teal-500 text-sm disabled:opacity-50"
        >
          <option value="general_question">General Question</option>
          <option value="client_care_inquiry">Inquiring for Client Home Care</option>
          <option value="caregiver_inquiry">Inquiring for Caregiver Employment</option>
        </select>
        {errors.inquiry_type && (
          <p className="text-xs text-red-400 mt-1">{errors.inquiry_type.message}</p>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">Message *</label>
        <textarea
          rows={4}
          placeholder="How can we help you or your family member?"
          disabled={isSubmitting}
          {...register('message')}
          className="w-full px-3 py-2 rounded bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 text-sm disabled:opacity-50"
        />
        {errors.message && (
          <p className="text-xs text-red-400 mt-1">{errors.message.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        style={{ backgroundColor: 'var(--primary, #0F766E)' }}
        className="w-full py-3 px-4 rounded text-white font-semibold text-sm hover:brightness-110 transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Sending Inquiry...</span>
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            <span>Submit Inquiry</span>
          </>
        )}
      </button>
    </form>
  );
};
