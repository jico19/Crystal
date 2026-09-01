'use client';

import * as React from 'react';
import type { Organization, InquiryType } from '@crystal/types';
import { CreatePublicInquirySchema } from '@crystal/validation';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';

export interface ContactFormProps {
  organization: Organization;
  initialInquiryType?: InquiryType;
  onSubmitInquiry?: (payload: any) => Promise<{ success: boolean; error?: string }>;
}

export function ContactForm({ organization, initialInquiryType, onSubmitInquiry }: ContactFormProps) {
  const [inquiryType, setInquiryType] = React.useState<InquiryType>(
    initialInquiryType || 'client_care_inquiry'
  );
  const [fullName, setFullName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [honeypot, setHoneypot] = React.useState('');

  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [status, setStatus] = React.useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setErrorMessage('');

    const payload = {
      org_id: organization.id,
      state_code: organization.state_code,
      full_name: fullName,
      email,
      phone,
      inquiry_type: inquiryType,
      message,
      source_url: typeof window !== 'undefined' ? window.location.href : 'https://' + organization.domain,
      honeypot,
    };

    // Client-side Zod validation
    const result = CreatePublicInquirySchema.safeParse(payload);
    if (!result.success) {
      const formattedErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        if (!formattedErrors[field]) {
          formattedErrors[field] = err.message;
        }
      });
      setFieldErrors(formattedErrors);
      return;
    }

    setStatus('submitting');

    try {
      if (onSubmitInquiry) {
        const response = await onSubmitInquiry(payload);
        if (!response.success) {
          setStatus('error');
          setErrorMessage(response.error || 'Submission failed. Please try again.');
          return;
        }
      } else {
        // Fallback demo/mock submission
        await new Promise((resolve) => setTimeout(resolve, 600));
      }

      setStatus('success');
      setFullName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 sm:p-10">
      {status === 'success' ? (
        <div className="text-center py-8 space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Thank You for Reaching Out!</h3>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            Your inquiry has been routed directly to our {organization.office_address.city}, {organization.office_address.state} care coordinator team. We will review your message and reach out promptly.
          </p>
          <Button variant="outline" onClick={() => setStatus('idle')} className="mt-4">
            Send Another Message
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-gray-900">Send an Inquiry</h3>
            <p className="text-sm text-gray-500">
              Direct connection to {organization.name} licensed staff in {organization.office_address.state}.
            </p>
          </div>

          {status === 'error' && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Hidden Honeypot Field */}
          <input
            type="text"
            name="website_url_hp"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {/* Inquiry Type Radio / Tabs */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">Inquiry Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setInquiryType('client_care_inquiry')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  inquiryType === 'client_care_inquiry'
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                In-Home Care
              </button>
              <button
                type="button"
                onClick={() => setInquiryType('caregiver_inquiry')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  inquiryType === 'caregiver_inquiry'
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Caregiver Career
              </button>
              <button
                type="button"
                onClick={() => setInquiryType('general_question')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                  inquiryType === 'general_question'
                    ? 'border-primary bg-primary text-white shadow-sm'
                    : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                General Question
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              id="full_name"
              placeholder="e.g. Jane Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={fieldErrors.full_name}
              required
            />
            <Input
              label="Phone Number *"
              id="phone"
              type="tel"
              placeholder="e.g. (404) 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              error={fieldErrors.phone}
              required
            />
          </div>

          <Input
            label="Email Address *"
            id="email"
            type="email"
            placeholder="e.g. jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={fieldErrors.email}
            required
          />

          <Textarea
            label="How Can We Help You? *"
            id="message"
            placeholder="Please share details about care requirements, schedule, or employment interest..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            error={fieldErrors.message}
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Submitting Inquiry...
              </>
            ) : (
              <>
                <Send className="w-5 h-5 mr-2" />
                Send Inquiry to {organization.name}
              </>
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center">
            🔒 Your information is confidential and protected by HIPAA privacy standards.
          </p>
        </form>
      )}
    </div>
  );
}
