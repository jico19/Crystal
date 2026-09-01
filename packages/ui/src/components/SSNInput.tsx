'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../lib/utils';

export interface SSNInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Controlled Social Security Number input.
 *
 * - Auto-formats raw digits to XXX-XX-XXXX as the user types.
 * - Masked display shows '***-**-XXXX' (last 4 always visible).
 * - Toggle eye icon to reveal / hide the full number.
 * - Stores only raw digits in `value` (no dashes).
 */
export function SSNInput({ value, onChange, error, label, disabled, id }: SSNInputProps) {
  const [visible, setVisible] = React.useState(false);
  const inputId = id ?? 'ssn-input';

  /** Format raw digits (max 9) to XXX-XX-XXXX display form */
  const formatSSN = (digits: string): string => {
    const d = digits.slice(0, 9);
    if (d.length <= 3) return d;
    if (d.length <= 5) return `${d.slice(0, 3)}-${d.slice(3)}`;
    return `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}`;
  };

  /** Mask all but last 4 digits */
  const maskSSN = (digits: string): string => {
    if (digits.length === 0) return '';
    if (digits.length <= 4) return digits.replace(/./g, '*');
    return `***-**-${digits.slice(-4)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 9);
    onChange(raw);
  };

  const rawDigits = value.replace(/\D/g, '').slice(0, 9);
  const displayValue = visible ? formatSSN(rawDigits) : maskSSN(rawDigits);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="off"
          disabled={disabled}
          value={displayValue}
          onChange={handleChange}
          placeholder="XXX-XX-XXXX"
          aria-label={label ?? 'Social Security Number'}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={cn(
            'flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 pr-11 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors font-mono tracking-widest',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-200'
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          disabled={disabled}
          aria-label={visible ? 'Hide SSN' : 'Show SSN'}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 disabled:pointer-events-none"
        >
          {visible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
      {error && (
        <p id={`${inputId}-error`} className="text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
