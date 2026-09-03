import { useState } from 'react';
import type { CreatePublicInquiryInput } from '@crystal/validation';

export type FormStatus = 'idle' | 'submitting' | 'success' | 'error';

interface SubmitInquiryResponse {
  inquiryId: string;
}

export function useSubmitInquiry() {
  const [status, setStatus] = useState<FormStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [inquiryId, setInquiryId] = useState<string | null>(null);

  const submitInquiry = async (payload: CreatePublicInquiryInput) => {
    try {
      setStatus('submitting');
      setError(null);

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/v1/inquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit inquiry. Please try again.');
      }

      const data: SubmitInquiryResponse = json.data;
      setInquiryId(data.inquiryId);
      setStatus('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setStatus('error');
    }
  };

  const reset = () => {
    setStatus('idle');
    setError(null);
    setInquiryId(null);
  };

  return {
    submitInquiry,
    status,
    error,
    inquiryId,
    isSubmitting: status === 'submitting',
    isSuccess: status === 'success',
    isError: status === 'error',
    reset,
  };
}
