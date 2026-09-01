'use client';

import * as React from 'react';
import { Loader2, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { StepIndicator } from './StepIndicator';
import { SSNInput } from './SSNInput';
import { RepeaterField } from './RepeaterField';
import { SignatureCanvasPad } from './SignatureCanvasPad';

export interface CaregiverApplyWizardProps {
  orgId: string;
  stateCode: 'GA' | 'IN' | 'FL';
  userId: string;
  apiBaseUrl?: string;
  onSubmitSuccess?: (applicationId: string) => void;
}

interface PersonalInfo {
  first_name: string;
  middle_name: string;
  last_name: string;
  email: string;
  phone: string;
  dob: string;
  ssn: string;
  address_street: string;
  address_unit: string;
  address_city: string;
  address_state: string;
  address_zip: string;
}

interface Availability {
  positions: string[];
  employment_types: string[];
  days: string[];
  shifts: string[];
  max_weekly_hours: string;
  willing_to_travel_miles: string;
}

interface WorkExperience {
  employer: string;
  title: string;
  start_date: string;
  end_date: string;
  reason_for_leaving: string;
}

interface Reference {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  years_known: string;
}

interface License {
  license_type: string;
  license_number: string;
  issuing_state: string;
  expiration_date: string;
}

interface Attestation {
  authorized_to_work_in_us: boolean;
  drug_screen_consent: boolean;
  background_check_consent: boolean;
  felony_conviction: boolean;
  felony_explanation: string;
  attestation_signature: string;
  signature_base64?: string;
}

interface FormState {
  personal_info: PersonalInfo;
  availability: Availability;
  work_experience: WorkExperience[];
  references: Reference[];
  licenses: License[];
  attestation: Attestation;
}

type StepErrors = Record<string, string>;

const STEP_LABELS = ['Personal Info', 'Availability', 'Experience', 'Licenses', 'Attestation'];
const POSITIONS = ['cna', 'hha', 'companion', 'pca', 'rn', 'lpn'];
const POSITION_LABELS: Record<string, string> = {
  cna: 'CNA',
  hha: 'HHA',
  companion: 'Companion',
  pca: 'PCA',
  rn: 'RN',
  lpn: 'LPN',
};

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'prn', label: 'PRN' },
];

const DAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

const SHIFTS = [
  { value: 'mornings', label: 'Mornings' },
  { value: 'afternoons', label: 'Afternoons' },
  { value: 'evenings', label: 'Evenings' },
  { value: 'overnights', label: 'Overnights' },
  { value: 'live_in', label: 'Live-In' },
];

const RELATIONSHIPS = ['professional', 'personal', 'supervisor'];
const LICENSE_TYPES = ['CNA', 'HHA', 'LPN', 'RN', 'CPR', 'PCA'];
const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

function emptyPersonalInfo(): PersonalInfo {
  return {
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    phone: '',
    dob: '',
    ssn: '',
    address_street: '',
    address_unit: '',
    address_city: '',
    address_state: '',
    address_zip: '',
  };
}

function emptyAvailability(): Availability {
  return {
    positions: [],
    employment_types: ['full_time'],
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
    shifts: ['mornings', 'afternoons'],
    max_weekly_hours: '40',
    willing_to_travel_miles: '25',
  };
}

function emptyWorkExperience(): WorkExperience {
  return { employer: '', title: '', start_date: '', end_date: '', reason_for_leaving: '' };
}

function emptyReference(): Reference {
  return { name: '', relationship: 'professional', phone: '', email: '', years_known: '2' };
}

function emptyLicense(): License {
  return { license_type: 'CNA', license_number: '', issuing_state: 'GA', expiration_date: '' };
}

function emptyAttestation(): Attestation {
  return {
    authorized_to_work_in_us: false,
    drug_screen_consent: false,
    background_check_consent: false,
    felony_conviction: false,
    felony_explanation: '',
    attestation_signature: '',
    signature_base64: '',
  };
}

function emptyFormState(): FormState {
  return {
    personal_info: emptyPersonalInfo(),
    availability: emptyAvailability(),
    work_experience: [emptyWorkExperience()],
    references: [emptyReference(), emptyReference()],
    licenses: [],
    attestation: emptyAttestation(),
  };
}

function validateStep1(p: PersonalInfo): StepErrors {
  const errs: StepErrors = {};
  if (!p.first_name.trim()) errs.first_name = 'First name is required';
  if (!p.last_name.trim()) errs.last_name = 'Last name is required';
  if (!p.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) errs.email = 'A valid email is required';
  if (!p.phone.trim()) errs.phone = 'Phone number is required';
  if (!p.dob) {
    errs.dob = 'Date of birth is required';
  } else {
    const age = (new Date().getTime() - new Date(p.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    if (age < 18) {
      errs.dob = 'Applicant must be at least 18 years old';
    }
  }
  if (!p.ssn || p.ssn.replace(/\D/g, '').length !== 9) errs.ssn = 'A valid 9-digit SSN is required';
  if (!p.address_street.trim()) errs.address_street = 'Street address is required';
  if (!p.address_city.trim()) errs.address_city = 'City is required';
  if (!p.address_state.trim()) errs.address_state = 'State is required';
  if (!p.address_zip.trim() || !/^\d{5}(-\d{4})?$/.test(p.address_zip)) errs.address_zip = 'A valid ZIP code is required';
  return errs;
}

function validateStep2(a: Availability): StepErrors {
  const errs: StepErrors = {};
  if (a.positions.length === 0) errs.positions = 'Select at least one position';
  if (a.employment_types.length === 0) errs.employment_types = 'Select at least one employment type';
  if (a.days.length === 0) errs.days = 'Select at least one available day';
  if (a.shifts.length === 0) errs.shifts = 'Select at least one shift';
  return errs;
}

function validateStep5(att: Attestation): StepErrors {
  const errs: StepErrors = {};
  if (!att.authorized_to_work_in_us) errs.authorized_to_work_in_us = 'You must be authorized to work in the US';
  if (!att.drug_screen_consent) errs.drug_screen_consent = 'Drug screen consent is required';
  if (!att.background_check_consent) errs.background_check_consent = 'Background check consent is required';
  if (att.felony_conviction && !att.felony_explanation.trim()) errs.felony_explanation = 'Please explain the felony conviction';
  if (!att.attestation_signature.trim() || att.attestation_signature.trim().length < 3) {
    errs.attestation_signature = 'Digital signature (full legal name) is required';
  }
  return errs;
}

const fieldClass = 'flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors';
const errorFieldClass = 'border-red-500 focus:border-red-500 focus:ring-red-200';

function FieldWrapper({ label, error, children, className }: { label?: string; error?: string; children: React.ReactNode; className?: string; }) {
  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && <label className="block text-sm font-semibold text-gray-700">{label}</label>}
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

function TextField({ label, value, onChange, error, placeholder, type = 'text', disabled }: { label?: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; type?: string; disabled?: boolean; }) {
  return (
    <FieldWrapper label={label} error={error}>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={cn(fieldClass, error && errorFieldClass)} />
    </FieldWrapper>
  );
}

function SelectField({ label, value, onChange, options, error, placeholder = 'Select…' }: { label?: string; value: string; onChange: (v: string) => void; options: string[]; error?: string; placeholder?: string; }) {
  return (
    <FieldWrapper label={label} error={error}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(fieldClass, 'cursor-pointer capitalize', error && errorFieldClass)}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o.replace(/_/g, ' ')}</option>)}
      </select>
    </FieldWrapper>
  );
}

function CheckboxGroup({ label, options, selected, onChange, error }: { label: string; options: { value: string; label: string }[]; selected: string[]; onChange: (s: string[]) => void; error?: string; }) {
  const toggle = (val: string) => {
    if (selected.includes(val)) onChange(selected.filter((v) => v !== val));
    else onChange([...selected, val]);
  };
  return (
    <FieldWrapper label={label} error={error}>
      <div className="flex flex-wrap gap-2 pt-1">
        {options.map(({ value, label: lbl }) => (
          <label key={value} className={cn('inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors select-none', selected.includes(value) ? 'border-primary bg-primary/10 font-semibold text-primary' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300')}>
            <input type="checkbox" className="sr-only" checked={selected.includes(value)} onChange={() => toggle(value)} />
            {lbl}
          </label>
        ))}
      </div>
    </FieldWrapper>
  );
}

function Step1Form({ data, errors, onChange }: { data: PersonalInfo; errors: StepErrors; onChange: (patch: Partial<PersonalInfo>) => void; }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TextField label="First Name *" value={data.first_name} onChange={(v) => onChange({ first_name: v })} error={errors.first_name} placeholder="Jane" />
        <TextField label="Middle Name" value={data.middle_name} onChange={(v) => onChange({ middle_name: v })} placeholder="M." />
        <TextField label="Last Name *" value={data.last_name} onChange={(v) => onChange({ last_name: v })} error={errors.last_name} placeholder="Doe" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Email *" type="email" value={data.email} onChange={(v) => onChange({ email: v })} error={errors.email} placeholder="jane@example.com" />
        <TextField label="Phone *" type="tel" value={data.phone} onChange={(v) => onChange({ phone: v })} error={errors.phone} placeholder="(555) 000-0000" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Date of Birth *" type="date" value={data.dob} onChange={(v) => onChange({ dob: v })} error={errors.dob} />
        <SSNInput label="Social Security Number *" value={data.ssn} onChange={(v) => onChange({ ssn: v })} error={errors.ssn} />
      </div>
      <div className="border-t border-gray-100 pt-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">Home Address</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldWrapper label="Street Address *" error={errors.address_street} className="sm:col-span-2">
            <input type="text" value={data.address_street} onChange={(e) => onChange({ address_street: e.target.value })} placeholder="123 Main St" className={cn(fieldClass, errors.address_street && errorFieldClass)} />
          </FieldWrapper>
          <TextField label="Unit / Apt" value={data.address_unit} onChange={(v) => onChange({ address_unit: v })} placeholder="Apt 4B" />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TextField label="City *" value={data.address_city} onChange={(v) => onChange({ address_city: v })} error={errors.address_city} placeholder="Atlanta" />
          <SelectField label="State *" value={data.address_state} onChange={(v) => onChange({ address_state: v })} options={US_STATES} error={errors.address_state} />
          <TextField label="ZIP Code *" value={data.address_zip} onChange={(v) => onChange({ address_zip: v })} error={errors.address_zip} placeholder="30301" />
        </div>
      </div>
    </div>
  );
}

function Step2Form({ data, errors, onChange }: { data: Availability; errors: StepErrors; onChange: (patch: Partial<Availability>) => void; }) {
  return (
    <div className="space-y-6">
      <CheckboxGroup label="Positions Sought *" options={POSITIONS.map((p) => ({ value: p, label: POSITION_LABELS[p] || p.toUpperCase() }))} selected={data.positions} onChange={(positions) => onChange({ positions })} error={errors.positions} />
      <CheckboxGroup label="Employment Type *" options={EMPLOYMENT_TYPES} selected={data.employment_types} onChange={(employment_types) => onChange({ employment_types })} error={errors.employment_types} />
      <CheckboxGroup label="Available Days *" options={DAYS} selected={data.days} onChange={(days) => onChange({ days })} error={errors.days} />
      <CheckboxGroup label="Available Shifts *" options={SHIFTS} selected={data.shifts} onChange={(shifts) => onChange({ shifts })} error={errors.shifts} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField label="Max Weekly Hours" type="number" value={data.max_weekly_hours} onChange={(v) => onChange({ max_weekly_hours: v })} placeholder="40" />
        <TextField label="Willing to Travel (miles)" type="number" value={data.willing_to_travel_miles} onChange={(v) => onChange({ willing_to_travel_miles: v })} placeholder="25" />
      </div>
    </div>
  );
}

function Step3Form({ workExperience, references, onChangeExperience, onChangeReferences }: { workExperience: WorkExperience[]; references: Reference[]; onChangeExperience: (items: WorkExperience[]) => void; onChangeReferences: (items: Reference[]) => void; }) {
  const updateExp = (index: number, patch: Partial<WorkExperience>) => {
    const next = workExperience.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChangeExperience(next);
  };
  const updateRef = (index: number, patch: Partial<Reference>) => {
    const next = references.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChangeReferences(next);
  };
  return (
    <div className="space-y-8">
      <RepeaterField<WorkExperience>
        label="Work Experience (Minimum 1 Required)"
        items={workExperience}
        onAdd={() => onChangeExperience([...workExperience, emptyWorkExperience()])}
        onRemove={(i) => onChangeExperience(workExperience.filter((_, idx) => idx !== i))}
        addLabel="Add Work Experience"
        minItems={1}
        renderItem={(item, index) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Employer *" value={item.employer} onChange={(v) => updateExp(index, { employer: v })} placeholder="ABC Home Care" />
              <TextField label="Job Title *" value={item.title} onChange={(v) => updateExp(index, { title: v })} placeholder="Certified Nursing Assistant" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Start Date *" type="date" value={item.start_date} onChange={(v) => updateExp(index, { start_date: v })} />
              <TextField label="End Date" type="date" value={item.end_date} onChange={(v) => updateExp(index, { end_date: v })} />
            </div>
            <TextField label="Reason for Leaving" value={item.reason_for_leaving} onChange={(v) => updateExp(index, { reason_for_leaving: v })} placeholder="Career advancement" />
          </div>
        )}
      />
      <RepeaterField<Reference>
        label="References (Minimum 2 Required)"
        items={references}
        onAdd={() => onChangeReferences([...references, emptyReference()])}
        onRemove={(i) => onChangeReferences(references.filter((_, idx) => idx !== i))}
        addLabel="Add Reference"
        minItems={2}
        renderItem={(item, index) => (
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField label="Full Name *" value={item.name} onChange={(v) => updateRef(index, { name: v })} placeholder="John Smith" />
              <SelectField label="Relationship *" value={item.relationship} onChange={(v) => updateRef(index, { relationship: v })} options={RELATIONSHIPS} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField label="Phone *" type="tel" value={item.phone} onChange={(v) => updateRef(index, { phone: v })} placeholder="(555) 000-0000" />
              <TextField label="Email" type="email" value={item.email} onChange={(v) => updateRef(index, { email: v })} placeholder="john@example.com" />
              <TextField label="Years Known *" type="number" value={item.years_known} onChange={(v) => updateRef(index, { years_known: v })} placeholder="3" />
            </div>
          </div>
        )}
      />
    </div>
  );
}

function Step4Form({ licenses, onChange }: { licenses: License[]; onChange: (items: License[]) => void; }) {
  const updateLicense = (index: number, patch: Partial<License>) => {
    const next = licenses.map((item, i) => (i === index ? { ...item, ...patch } : item));
    onChange(next);
  };
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-teal-100 bg-teal-50 px-4 py-3">
        <p className="text-sm text-teal-800">
          <strong>Optional:</strong> Add any professional healthcare licenses or certifications you hold (CNA, HHA, LPN, RN, CPR). You may proceed to the next step without adding any if you have none.
        </p>
      </div>
      <RepeaterField<License>
        label="Licenses & Certifications"
        items={licenses}
        onAdd={() => onChange([...licenses, emptyLicense()])}
        onRemove={(i) => onChange(licenses.filter((_, idx) => idx !== i))}
        addLabel="Add License"
        renderItem={(item, index) => (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField label="License Type" value={item.license_type} onChange={(v) => updateLicense(index, { license_type: v })} options={LICENSE_TYPES} />
            <TextField label="License Number" value={item.license_number} onChange={(v) => updateLicense(index, { license_number: v })} placeholder="CNA-123456" />
            <SelectField label="Issuing State" value={item.issuing_state} onChange={(v) => updateLicense(index, { issuing_state: v })} options={US_STATES} />
            <TextField label="Expiration Date" type="date" value={item.expiration_date} onChange={(v) => updateLicense(index, { expiration_date: v })} />
          </div>
        )}
      />
    </div>
  );
}

function Step5Form({ data, errors, onChange }: { data: Attestation; errors: StepErrors; onChange: (patch: Partial<Attestation>) => void; }) {
  const now = React.useMemo(() => new Intl.DateTimeFormat('en-US', { dateStyle: 'full', timeStyle: 'medium' }).format(new Date()), []);
  const checkboxItems = [
    { key: 'authorized_to_work_in_us' as keyof Attestation, label: 'I am legally authorized to work in the United States.' },
    { key: 'drug_screen_consent' as keyof Attestation, label: 'I consent to a pre-employment drug screening.' },
    { key: 'background_check_consent' as keyof Attestation, label: 'I consent to a background check as a condition of employment.' },
  ];
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-500">
        Attestation date/time: <strong className="text-gray-700">{now}</strong>
      </div>
      {checkboxItems.map(({ key, label }) => (
        <div key={key} className="space-y-1">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={data[key] as boolean} onChange={(e) => onChange({ [key]: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary" />
            <span className="text-sm text-gray-700">{label}</span>
          </label>
          {errors[key] && <p className="ml-7 text-xs font-medium text-red-600">{errors[key]}</p>}
        </div>
      ))}
      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-3">
          <input type="checkbox" checked={data.felony_conviction} onChange={(e) => onChange({ felony_conviction: e.target.checked })} className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-gray-300 text-primary focus:ring-primary" />
          <span className="text-sm text-gray-700">I have been convicted of a felony in the past 7 years.</span>
        </label>
        {data.felony_conviction && (
          <FieldWrapper label="Please explain the conviction *" error={errors.felony_explanation} className="ml-7">
            <textarea value={data.felony_explanation} onChange={(e) => onChange({ felony_explanation: e.target.value })} rows={3} placeholder="Provide details..." className={cn('w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors resize-none', errors.felony_explanation && errorFieldClass)} />
          </FieldWrapper>
        )}
      </div>

      {/* Visual Signature Canvas (Draw or Type) */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <label className="block text-sm font-semibold text-gray-700">
          Digital Signature Pad (Draw or Type)
        </label>
        <p className="text-xs text-gray-500">
          Draw your signature using mouse, stylus, or touch, or switch to type to generate an electronic signature.
        </p>
        <SignatureCanvasPad
          value={data.signature_base64}
          signerName={data.attestation_signature}
          onChange={(sig) => onChange({ signature_base64: sig })}
        />
      </div>

      <FieldWrapper label="Electronic Signature Attestation (Full Legal Name) *" error={errors.attestation_signature}>
        <input type="text" value={data.attestation_signature} onChange={(e) => onChange({ attestation_signature: e.target.value })} placeholder="Type your full legal name" className={cn(fieldClass, 'font-serif italic', errors.attestation_signature && errorFieldClass)} />
        <p className="text-xs text-gray-400">By typing your full legal name and providing your digital signature, you certify under penalty of perjury that all information provided in this application is true and complete.</p>
      </FieldWrapper>
    </div>
  );
}

export function CaregiverApplyWizard({ orgId, stateCode, userId, apiBaseUrl = 'http://localhost:3000', onSubmitSuccess }: CaregiverApplyWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [completedSteps, setCompletedSteps] = React.useState<number[]>([]);
  const [formState, setFormState] = React.useState<FormState>(emptyFormState());
  const [errors, setErrors] = React.useState<StepErrors>({});
  const [isSaving, setIsSaving] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [draftSaved, setDraftSaved] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedPayloadRef = React.useRef<string>('');

  const LOCAL_STORAGE_KEY = `crystal_draft_${userId}`;

  // Synchronous 0ms local storage write
  const saveToLocalStorage = React.useCallback((state: FormState, step: number) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify({
          state,
          step,
          saved_at: Date.now(),
        })
      );
    } catch {
      /* ignore quota errors */
    }
  }, [LOCAL_STORAGE_KEY]);

  // Restore draft from localStorage immediately (0ms), then reconcile with API in background
  React.useEffect(() => {
    let localTimestamp = 0;
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.state) {
            setFormState(parsed.state);
            if (parsed.step && parsed.step >= 1 && parsed.step <= 5) {
              setCurrentStep(parsed.step);
            }
            localTimestamp = Number(parsed.saved_at) || 0;
          }
        }
      } catch {
        /* ignore parsing errors */
      }
    }

    const loadDraft = async () => {
      try {
        const url = `${apiBaseUrl}/api/v1/caregivers/draft?user_id=${encodeURIComponent(userId)}&org_id=${encodeURIComponent(orgId)}&state_code=${encodeURIComponent(stateCode)}`;
        const res = await fetch(url, {
          headers: {
            'x-user-id': userId,
            'x-org-id': orgId,
            'x-state-code': stateCode,
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.profile) {
            const p = json.profile;
            const cloudUpdatedAt = p.updated_at ? new Date(p.updated_at).getTime() : 0;
            if (cloudUpdatedAt >= localTimestamp || localTimestamp === 0) {
              setFormState((prev) => ({
                ...prev,
                personal_info: p.personal_info ? {
                  first_name: p.personal_info.first_name || '',
                  middle_name: p.personal_info.middle_name || '',
                  last_name: p.personal_info.last_name || '',
                  email: p.personal_info.email || '',
                  phone: p.personal_info.phone || '',
                  dob: p.personal_info.dob || '',
                  ssn: p.personal_info.ssn_last4 ? `***-**-${p.personal_info.ssn_last4}` : '',
                  address_street: p.personal_info.address?.street || '',
                  address_unit: p.personal_info.address?.unit || '',
                  address_city: p.personal_info.address?.city || '',
                  address_state: p.personal_info.address?.state || stateCode,
                  address_zip: p.personal_info.address?.zip || '',
                } : prev.personal_info,
                availability: p.availability ? {
                  positions: p.positions_applied || [],
                  employment_types: [
                    ...(p.availability.full_time ? ['full_time'] : []),
                    ...(p.availability.part_time ? ['part_time'] : []),
                    ...(p.availability.prn ? ['prn'] : []),
                  ],
                  days: p.availability.days_available || ['mon', 'tue', 'wed', 'thu', 'fri'],
                  shifts: p.availability.shifts_available || ['mornings', 'afternoons'],
                  max_weekly_hours: String(p.availability.max_weekly_hours || 40),
                  willing_to_travel_miles: String(p.availability.willing_to_travel_miles || 25),
                } : prev.availability,
                work_experience: Array.isArray(p.experience_history) && p.experience_history.length > 0
                  ? p.experience_history.map((w: any) => ({
                      employer: w.employer_name || '',
                      title: w.job_title || '',
                      start_date: w.start_date || '',
                      end_date: w.end_date || '',
                      reason_for_leaving: w.reason_for_leaving || '',
                    }))
                  : prev.work_experience,
                references: Array.isArray(p.references) && p.references.length > 0
                  ? p.references.map((r: any) => ({
                      name: r.name || '',
                      relationship: r.relationship || 'professional',
                      phone: r.phone || '',
                      email: r.email || '',
                      years_known: String(r.years_known || 2),
                    }))
                  : prev.references,
                licenses: Array.isArray(p.professional_licenses) && p.professional_licenses.length > 0
                  ? p.professional_licenses.map((l: any) => ({
                      license_type: l.license_type || 'CNA',
                      license_number: l.license_number || '',
                      issuing_state: l.issuing_state || stateCode,
                      expiration_date: l.expiration_date || '',
                    }))
                  : prev.licenses,
                attestation: p.legal_disclosures ? {
                  authorized_to_work_in_us: Boolean(p.legal_disclosures.authorized_to_work_in_us),
                  drug_screen_consent: Boolean(p.legal_disclosures.drug_screen_consent),
                  background_check_consent: Boolean(p.legal_disclosures.background_check_consent),
                  felony_conviction: Boolean(p.legal_disclosures.felony_conviction),
                  felony_explanation: p.legal_disclosures.felony_explanation || '',
                  attestation_signature: p.legal_disclosures.attestation_signature || '',
                  signature_base64: p.legal_disclosures.signature_base64 || '',
                } : prev.attestation,
              }));
              if (p.application_step && p.application_step >= 1 && p.application_step <= 5) {
                setCurrentStep(p.application_step);
              }
            }
          }
        }
      } catch {
        // Graceful fallback to initial state
      }
    };
    loadDraft();
  }, [LOCAL_STORAGE_KEY, apiBaseUrl, userId, orgId, stateCode]);

  // Transform formState into API-compliant payload for the specific step
  const buildStepPayload = React.useCallback((state: FormState, step: number) => {
    const dataPayload: Record<string, unknown> = {
      user_id: userId,
    };

    if (step === 1) {
      dataPayload.first_name = state.personal_info.first_name;
      dataPayload.middle_name = state.personal_info.middle_name || undefined;
      dataPayload.last_name = state.personal_info.last_name;
      dataPayload.email = state.personal_info.email;
      dataPayload.phone = state.personal_info.phone;
      dataPayload.dob = state.personal_info.dob;
      dataPayload.ssn = state.personal_info.ssn;
      dataPayload.address = {
        street: state.personal_info.address_street,
        unit: state.personal_info.address_unit || undefined,
        city: state.personal_info.address_city,
        state: state.personal_info.address_state,
        zip: state.personal_info.address_zip,
      };
    } else if (step === 2) {
      dataPayload.positions_applied = state.availability.positions;
      dataPayload.availability = {
        full_time: state.availability.employment_types.includes('full_time'),
        part_time: state.availability.employment_types.includes('part_time'),
        prn: state.availability.employment_types.includes('prn'),
        days_available: state.availability.days,
        shifts_available: state.availability.shifts,
        max_weekly_hours: Number(state.availability.max_weekly_hours) || 40,
        willing_to_travel_miles: Number(state.availability.willing_to_travel_miles) || 25,
      };
    } else if (step === 3) {
      dataPayload.experience_history = state.work_experience.map((w) => ({
        employer_name: w.employer,
        job_title: w.title,
        start_date: w.start_date,
        end_date: w.end_date || undefined,
        reason_for_leaving: w.reason_for_leaving || undefined,
      }));
      dataPayload.references = state.references.map((r) => ({
        name: r.name,
        relationship: r.relationship,
        phone: r.phone,
        email: r.email || undefined,
        years_known: Number(r.years_known) || 1,
      }));
    } else if (step === 4) {
      dataPayload.professional_licenses = state.licenses.map((l) => ({
        license_type: l.license_type,
        license_number: l.license_number,
        issuing_state: l.issuing_state,
        expiration_date: l.expiration_date,
      }));
    }

    return {
      step: step as 1 | 2 | 3 | 4 | 5,
      org_id: orgId,
      state_code: stateCode,
      data: dataPayload,
    };
  }, [orgId, stateCode, userId]);

  const saveDraft = React.useCallback(async (state: FormState, step: number, force = false) => {
    // 1. Instant 0ms local storage backup
    saveToLocalStorage(state, step);

    const payload = buildStepPayload(state, step);
    const payloadStr = JSON.stringify(payload);

    // 2. Dirty check: Skip network call if payload hasn't changed
    if (!force && payloadStr === lastSavedPayloadRef.current) {
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/caregivers/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-org-id': orgId,
          'x-state-code': stateCode,
        },
        body: payloadStr,
      });
      if (res.ok) {
        lastSavedPayloadRef.current = payloadStr;
        setDraftSaved(true);
        if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
        draftTimerRef.current = setTimeout(() => setDraftSaved(false), 2500);
      }
    } catch {
      // Silent fallback: local storage already has state
    } finally {
      setIsSaving(false);
    }
  }, [apiBaseUrl, buildStepPayload, orgId, saveToLocalStorage, stateCode, userId]);

  const scheduleSave = React.useCallback((state: FormState) => {
    // Save to local storage on every keystroke
    saveToLocalStorage(state, currentStep);

    // Debounce background cloud sync to 400ms
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveDraft(state, currentStep);
    }, 400);
  }, [saveDraft, currentStep, saveToLocalStorage]);

  const patchPersonalInfo = (patch: Partial<PersonalInfo>) => {
    setFormState((prev) => {
      const next = { ...prev, personal_info: { ...prev.personal_info, ...patch } };
      scheduleSave(next);
      return next;
    });
    setErrors({});
  };

  const patchAvailability = (patch: Partial<Availability>) => {
    setFormState((prev) => {
      const next = { ...prev, availability: { ...prev.availability, ...patch } };
      scheduleSave(next);
      return next;
    });
    setErrors({});
  };

  const patchAttestation = (patch: Partial<Attestation>) => {
    setFormState((prev) => {
      const next = { ...prev, attestation: { ...prev.attestation, ...patch } };
      scheduleSave(next);
      return next;
    });
    setErrors({});
  };

  const setWorkExperience = (items: WorkExperience[]) => {
    setFormState((prev) => {
      const next = { ...prev, work_experience: items };
      scheduleSave(next);
      return next;
    });
  };

  const setReferences = (items: Reference[]) => {
    setFormState((prev) => {
      const next = { ...prev, references: items };
      scheduleSave(next);
      return next;
    });
  };

  const setLicenses = (items: License[]) => {
    setFormState((prev) => {
      const next = { ...prev, licenses: items };
      scheduleSave(next);
      return next;
    });
  };

  const validateCurrentStep = (): boolean => {
    let errs: StepErrors = {};
    if (currentStep === 1) errs = validateStep1(formState.personal_info);
    if (currentStep === 2) errs = validateStep2(formState.availability);
    if (currentStep === 5) errs = validateStep5(formState.attestation);
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;
    const nextCompleted = completedSteps.includes(currentStep) ? completedSteps : [...completedSteps, currentStep];
    setCompletedSteps(nextCompleted);
    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);
    setErrors({});
    // Flush save immediately to cloud on step advance
    await saveDraft(formState, currentStep, true);
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep((s) => Math.max(1, s - 1));
  };

  const handleSaveAndExit = async () => {
    await saveDraft(formState, currentStep, true);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const legalDisclosures = {
        authorized_to_work_in_us: formState.attestation.authorized_to_work_in_us,
        felony_conviction: formState.attestation.felony_conviction,
        felony_explanation: formState.attestation.felony_explanation || undefined,
        drug_screen_consent: formState.attestation.drug_screen_consent,
        background_check_consent: formState.attestation.background_check_consent,
        attestation_signature: formState.attestation.attestation_signature,
        attestation_timestamp: new Date().toISOString(),
        signature_base64: formState.attestation.signature_base64 || undefined,
      };

      const res = await fetch(`${apiBaseUrl}/api/v1/caregivers/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'x-org-id': orgId,
          'x-state-code': stateCode,
        },
        body: JSON.stringify({
          user_id: userId,
          org_id: orgId,
          state_code: stateCode,
          legal_disclosures: legalDisclosures,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Server error: ${res.status}`);
      }

      const json = await res.json();
      const applicationId = json?.application_id ?? 'submitted';
      // Clear completed draft from local storage
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        } catch {
          /* ignore */
        }
      }
      onSubmitSuccess?.(applicationId);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return <Step1Form data={formState.personal_info} errors={errors} onChange={patchPersonalInfo} />;
      case 2: return <Step2Form data={formState.availability} errors={errors} onChange={patchAvailability} />;
      case 3: return <Step3Form workExperience={formState.work_experience} references={formState.references} onChangeExperience={setWorkExperience} onChangeReferences={setReferences} />;
      case 4: return <Step4Form licenses={formState.licenses} onChange={setLicenses} />;
      case 5: return <Step5Form data={formState.attestation} errors={errors} onChange={patchAttestation} />;
      default: return null;
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8">
      <StepIndicator steps={STEP_LABELS} currentStep={currentStep} completedSteps={completedSteps} />
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Step {currentStep}: {STEP_LABELS[currentStep - 1]}</h2>
            <p className="mt-0.5 text-sm text-gray-500">{currentStep} of {STEP_LABELS.length}</p>
          </div>
          <div className={cn('flex items-center gap-1.5 text-xs font-medium transition-opacity duration-300', (draftSaved || isSaving) ? 'opacity-100' : 'opacity-0')}>
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />
                <span className="text-gray-400">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                <span className="text-green-600">Draft saved</span>
              </>
            )}
          </div>
        </div>
        {renderStep()}
        {submitError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm font-medium text-red-700">{submitError}</p>
          </div>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <button type="button" onClick={handleBack} disabled={isSubmitting} className="inline-flex h-11 items-center gap-2 rounded-lg border-2 border-gray-200 px-5 text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50">Back</button>
            )}
            <button type="button" onClick={handleSaveAndExit} disabled={isSaving || isSubmitting} className="inline-flex h-11 items-center gap-2 rounded-lg border-2 border-gray-200 px-5 text-sm font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50">
              <Save className="h-4 w-4" aria-hidden="true" />
              Save &amp; Exit
            </button>
          </div>
          <div>
            {currentStep < STEP_LABELS.length ? (
              <button type="button" onClick={handleNext} disabled={isSaving} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Next
              </button>
            ) : (
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="inline-flex h-11 items-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-white hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm">
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
