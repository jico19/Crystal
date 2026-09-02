'use client';

import React, { useState } from 'react';
import type { ClientIntakeInput, StateCode, PayerType } from '@crystal/types';

export interface ClientIntakeWizardProps {
  orgId: string;
  stateCode: StateCode;
  organizationName: string;
  onSubmit: (data: ClientIntakeInput) => Promise<{ success: boolean; error?: string; client?: any }>;
  onSuccess?: (clientId: string) => void;
}

export const ClientIntakeWizard: React.FC<ClientIntakeWizardProps> = ({
  orgId,
  stateCode,
  organizationName,
  onSubmit,
  onSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedClientId, setSubmittedClientId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<ClientIntakeInput>({
    org_id: orgId,
    state_code: stateCode,
    first_name: '',
    middle_name: '',
    last_name: '',
    dob: '',
    gender: 'Female',
    ssn_last4: '',
    medicaid_id: '',
    primary_phone: '',
    service_address: {
      street: '',
      apt: '',
      city: '',
      state: stateCode,
      zip: '',
      gate_code: '',
    },
    emergency_contacts: [
      {
        name: '',
        relationship: '',
        phone: '',
        is_primary: true,
        has_poa: false,
      },
    ],
    primary_physician: {
      name: '',
      practice: '',
      phone: '',
      fax: '',
      npi: '',
    },
    care_needs: {
      adls: ['bathing', 'dressing'],
      iadls: ['meal_prep', 'medication_reminders'],
      allergies: [],
      diagnoses: [],
      mobility_notes: '',
      dietary_restrictions: '',
    },
    primary_payer: 'medicaid_waiver' as PayerType,
    payer_details: {
      policy_number: '',
      case_manager_name: '',
      case_manager_phone: '',
      pre_auth_number: '',
    },
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [diagnosisInput, setDiagnosisInput] = useState('');

  const adlOptions = [
    { id: 'bathing', label: 'Bathing & Shower Assistance' },
    { id: 'dressing', label: 'Dressing & Grooming' },
    { id: 'toileting', label: 'Toileting & Incontinence Care' },
    { id: 'transferring', label: 'Transferring & Bed Mobility' },
    { id: 'ambulation', label: 'Safe Walking & Fall Prevention' },
    { id: 'eating', label: 'Feeding & Eating Support' },
  ];

  const iadlOptions = [
    { id: 'meal_prep', label: 'Nutritious Meal Preparation' },
    { id: 'medication_reminders', label: 'Medication Reminders' },
    { id: 'light_housekeeping', label: 'Light Housekeeping & Laundry' },
    { id: 'transportation', label: 'Doctor Appointment Escort' },
    { id: 'shopping', label: 'Grocery Shopping & Errands' },
    { id: 'companionship', label: 'Companionship & Socialization' },
  ];

  const handleNext = () => {
    setErrorMsg(null);
    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.dob || !formData.primary_phone) {
        setErrorMsg('Please complete all required demographic fields.');
        return;
      }
      if (!formData.service_address.street || !formData.service_address.city || !formData.service_address.zip) {
        setErrorMsg('Please complete the service street address, city, and ZIP code.');
        return;
      }
    }
    if (step === 2) {
      const contact = formData.emergency_contacts[0];
      if (!contact || !contact.name || !contact.phone || !contact.relationship) {
        setErrorMsg('Please provide at least one primary emergency contact with name, relationship, and phone.');
        return;
      }
    }
    if (step === 3) {
      if (!formData.primary_physician.name || !formData.primary_physician.phone) {
        setErrorMsg('Please enter primary physician name and contact telephone.');
        return;
      }
    }
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrorMsg(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const toggleAdl = (id: string) => {
    setFormData((prev) => {
      const adls = prev.care_needs.adls.includes(id)
        ? prev.care_needs.adls.filter((item) => item !== id)
        : [...prev.care_needs.adls, id];
      return { ...prev, care_needs: { ...prev.care_needs, adls } };
    });
  };

  const toggleIadl = (id: string) => {
    setFormData((prev) => {
      const iadls = prev.care_needs.iadls.includes(id)
        ? prev.care_needs.iadls.filter((item) => item !== id)
        : [...prev.care_needs.iadls, id];
      return { ...prev, care_needs: { ...prev.care_needs, iadls } };
    });
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        care_needs: {
          ...prev.care_needs,
          allergies: [...prev.care_needs.allergies, allergyInput.trim()],
        },
      }));
      setAllergyInput('');
    }
  };

  const removeAllergy = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      care_needs: {
        ...prev.care_needs,
        allergies: prev.care_needs.allergies.filter((_, i) => i !== index),
      },
    }));
  };

  const addDiagnosis = () => {
    if (diagnosisInput.trim()) {
      setFormData((prev) => ({
        ...prev,
        care_needs: {
          ...prev.care_needs,
          diagnoses: [...prev.care_needs.diagnoses, diagnosisInput.trim()],
        },
      }));
      setDiagnosisInput('');
    }
  };

  const removeDiagnosis = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      care_needs: {
        ...prev.care_needs,
        diagnoses: prev.care_needs.diagnoses.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);
      const res = await onSubmit(formData);
      if (res.success && res.client) {
        setSubmittedClientId(res.client.id);
        if (onSuccess) onSuccess(res.client.id);
      } else {
        setErrorMsg(res.error || 'Failed to submit client intake.');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    'Demographics',
    'Emergency Contacts',
    'Physician',
    'Care Needs (ADLs)',
    'Payer & Review',
  ];

  if (submittedClientId) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center my-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-4">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Client Intake Submitted!</h2>
        <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto">
          Thank you. The digital intake packet for <strong>{formData.first_name} {formData.last_name}</strong> has been securely logged with {organizationName}.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-sm mx-auto mb-6 text-xs text-slate-600">
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span>Client Reference ID:</span>
            <span className="font-mono font-bold text-slate-900">{submittedClientId}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-200">
            <span>Operating State:</span>
            <span className="font-semibold text-slate-900">{stateCode}</span>
          </div>
          <div className="flex justify-between py-1">
            <span>Admission Status:</span>
            <span className="font-semibold text-indigo-600 uppercase">Intake Pending Review</span>
          </div>
        </div>

        <button
          onClick={() => {
            setSubmittedClientId(null);
            setStep(1);
          }}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
        >
          Submit Another Intake
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-6">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              {organizationName} • State of {stateCode}
            </span>
            <h2 className="text-xl font-bold tracking-tight">Client Admission & Care Intake</h2>
          </div>
          <div className="text-right text-xs text-slate-400">
            Step {step} of {steps.length}
          </div>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-5 gap-1 mt-4">
          {steps.map((label, idx) => {
            const stepNum = idx + 1;
            const isCurrent = step === stepNum;
            const isDone = step > stepNum;
            return (
              <div key={label} className="text-center">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    isDone ? 'bg-emerald-400' : isCurrent ? 'bg-indigo-400' : 'bg-slate-800'
                  }`}
                />
                <span
                  className={`text-[10px] mt-1 block truncate ${
                    isCurrent ? 'text-white font-semibold' : 'text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Body / Step Content */}
      <div className="p-6 md:p-8">
        {errorMsg && (
          <div className="mb-6 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* STEP 1: Demographics */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Client Demographics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={formData.middle_name || ''}
                    onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender || 'Female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other / Non-Binary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Telephone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="(404) 555-0199"
                    value={formData.primary_phone}
                    onChange={(e) => setFormData({ ...formData, primary_phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SSN (Last 4 digits)</label>
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="1234"
                    value={formData.ssn_last4 || ''}
                    onChange={(e) => setFormData({ ...formData, ssn_last4: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medicaid Member ID</label>
                  <input
                    type="text"
                    placeholder="e.g. GA-MED-12345"
                    value={formData.medicaid_id || ''}
                    onChange={(e) => setFormData({ ...formData, medicaid_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pt-3">Service Address</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.service_address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_address: { ...formData.service_address, street: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Apt / Suite</label>
                  <input
                    type="text"
                    value={formData.service_address.apt || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_address: { ...formData.service_address, apt: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.service_address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_address: { ...formData.service_address, city: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    readOnly
                    value={stateCode}
                    className="w-full px-3 py-2 bg-slate-100 border rounded-lg text-sm text-slate-600 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ZIP Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.service_address.zip}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_address: { ...formData.service_address, zip: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Emergency Contacts & POA */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Emergency Contacts & Legal Representatives</h3>
              <p className="text-xs text-slate-500">Provide family members or designated agents authorized to make care decisions.</p>

              {formData.emergency_contacts.map((contact, index) => (
                <div key={index} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name *</label>
                      <input
                        type="text"
                        required
                        value={contact.name}
                        onChange={(e) => {
                          const updated = [...formData.emergency_contacts];
                          updated[index].name = e.target.value;
                          setFormData({ ...formData, emergency_contacts: updated });
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Relationship *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Daughter, Son, Guardian"
                        value={contact.relationship}
                        onChange={(e) => {
                          const updated = [...formData.emergency_contacts];
                          updated[index].relationship = e.target.value;
                          setFormData({ ...formData, emergency_contacts: updated });
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                      <input
                        type="tel"
                        required
                        value={contact.phone}
                        onChange={(e) => {
                          const updated = [...formData.emergency_contacts];
                          updated[index].phone = e.target.value;
                          setFormData({ ...formData, emergency_contacts: updated });
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contact.is_primary}
                        onChange={(e) => {
                          const updated = [...formData.emergency_contacts];
                          updated[index].is_primary = e.target.checked;
                          setFormData({ ...formData, emergency_contacts: updated });
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span>Primary Emergency Contact</span>
                    </label>

                    <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={contact.has_poa}
                        onChange={(e) => {
                          const updated = [...formData.emergency_contacts];
                          updated[index].has_poa = e.target.checked;
                          setFormData({ ...formData, emergency_contacts: updated });
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span>Has Healthcare Power of Attorney (POA)</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 3: Primary Physician */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b pb-2">Primary Physician & Medical Providers</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Physician Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Dr. John Doe, MD"
                    value={formData.primary_physician.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_physician: { ...formData.primary_physician, name: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinic / Practice Name</label>
                  <input
                    type="text"
                    value={formData.primary_physician.practice || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_physician: { ...formData.primary_physician, practice: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Office Telephone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.primary_physician.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_physician: { ...formData.primary_physician, phone: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Office Fax</label>
                  <input
                    type="tel"
                    value={formData.primary_physician.fax || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_physician: { ...formData.primary_physician, fax: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">NPI Number (Optional)</label>
                  <input
                    type="text"
                    value={formData.primary_physician.npi || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        primary_physician: { ...formData.primary_physician, npi: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Care Needs & ADLs */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Activities of Daily Living (ADLs)</h3>
                <p className="text-xs text-slate-500 mb-3">Select hands-on personal care tasks required:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {adlOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formData.care_needs.adls.includes(opt.id)}
                        onChange={() => toggleAdl(opt.id)}
                        className="rounded text-indigo-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-slate-900 mb-1">Instrumental Activities (IADLs)</h3>
                <p className="text-xs text-slate-500 mb-3">Select household & supportive assistance required:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {iadlOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer hover:bg-slate-50 text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={formData.care_needs.iadls.includes(opt.id)}
                        onChange={() => toggleIadl(opt.id)}
                        className="rounded text-indigo-600"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Allergies & Diagnoses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Allergies</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. Penicillin, Latex"
                      value={allergyInput}
                      onChange={(e) => setAllergyInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addAllergy();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={addAllergy}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.care_needs.allergies.map((allg, idx) => (
                      <span key={idx} className="bg-rose-50 text-rose-700 border border-rose-200 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        {allg}
                        <button type="button" onClick={() => removeAllergy(idx)} className="hover:text-rose-900">&times;</button>
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Medical Diagnoses</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="e.g. Dementia, Hypertension"
                      value={diagnosisInput}
                      onChange={(e) => setDiagnosisInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDiagnosis();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-lg text-xs"
                    />
                    <button
                      type="button"
                      onClick={addDiagnosis}
                      className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-xs font-medium"
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.care_needs.diagnoses.map((diag, idx) => (
                      <span key={idx} className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                        {diag}
                        <button type="button" onClick={() => removeDiagnosis(idx)} className="hover:text-indigo-900">&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: Payer Information & Review */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 mb-2">Payer Source & Authorization</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Payment Source *</label>
                    <select
                      value={formData.primary_payer}
                      onChange={(e) => setFormData({ ...formData, primary_payer: e.target.value as PayerType })}
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    >
                      <option value="medicaid_waiver">Medicaid Waiver (CCSP/SOURCE/A&D)</option>
                      <option value="private_pay">Private Pay / Self Pay</option>
                      <option value="va_community_care">VA Community Care Network</option>
                      <option value="long_term_care_insurance">Long-Term Care Insurance</option>
                      <option value="commercial_insurance">Commercial Insurance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Policy / Authorization Number</label>
                    <input
                      type="text"
                      placeholder="e.g. AUTH-2026-99"
                      value={formData.payer_details?.policy_number || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payer_details: { ...formData.payer_details, policy_number: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Case Manager Name</label>
                    <input
                      type="text"
                      value={formData.payer_details?.case_manager_name || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payer_details: { ...formData.payer_details, case_manager_name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Case Manager Phone</label>
                    <input
                      type="tel"
                      value={formData.payer_details?.case_manager_phone || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          payer_details: { ...formData.payer_details, case_manager_phone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
                <h4 className="font-bold text-slate-900 text-sm mb-2">Admission Summary Review</h4>
                <div className="grid grid-cols-2 gap-2 text-slate-600">
                  <div><strong>Client:</strong> {formData.first_name} {formData.last_name} ({formData.dob})</div>
                  <div><strong>Phone:</strong> {formData.primary_phone}</div>
                  <div><strong>Service Address:</strong> {formData.service_address.street}, {formData.service_address.city}, {formData.service_address.state} {formData.service_address.zip}</div>
                  <div><strong>Payer:</strong> {formData.primary_payer.replace('_', ' ').toUpperCase()}</div>
                  <div><strong>ADLs Selected:</strong> {formData.care_needs.adls.length} tasks</div>
                  <div><strong>Primary Contact:</strong> {formData.emergency_contacts[0]?.name} ({formData.emergency_contacts[0]?.relationship})</div>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="mt-8 pt-4 border-t border-slate-200 flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                &larr; Back
              </button>
            ) : (
              <div />
            )}

            {step < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-colors"
              >
                Continue &rarr;
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md transition-all flex items-center gap-2"
              >
                {submitting ? 'Submitting Intake...' : 'Submit Client Admission'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
