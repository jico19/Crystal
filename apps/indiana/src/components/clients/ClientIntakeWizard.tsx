import React, { useState } from 'react';
import { Button, Input, StepIndicator } from '@crystal/ui';
import { CreateClientIntakeSchema, type CreateClientIntakeInput } from '@crystal/validation';
import { CheckCircle2, AlertCircle, ArrowLeft, ArrowRight, UserPlus } from 'lucide-react';

export interface ClientIntakeWizardProps {
  orgId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientIntakeInput) => Promise<void>;
}

export const ClientIntakeWizard: React.FC<ClientIntakeWizardProps> = ({
  orgId,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Form states
  const [formData, setFormData] = useState<Partial<CreateClientIntakeInput>>({
    org_id: orgId,
    first_name: '',
    last_name: '',
    dob: '',
    gender: 'female',
    medicaid_id: '',
    service_address: {
      street: '',
      city: '',
      state: 'GA',
      zip: '',
    },
    emergency_contacts: [
      {
        name: '',
        relationship: '',
        phone: '',
        is_primary: true,
      },
    ],
    care_needs: {
      primary_diagnosis: '',
      mobility_assistance: false,
      bathing_dressing: false,
      meal_prep: false,
      medication_reminders: false,
      notes: '',
    },
    payer_details: {
      payer_name: '',
      plan_type: 'Medicaid Waiver (CCSP / SOURCE)',
      policy_number: '',
      coordinator_name: '',
      coordinator_phone: '',
    },
  });

  if (!isOpen) return null;

  const handleNext = () => {
    setErrorMsg(null);

    if (step === 1) {
      if (!formData.first_name || !formData.last_name || !formData.dob) {
        setErrorMsg('First name, last name, and date of birth are required.');
        return;
      }
    } else if (step === 2) {
      const addr = formData.service_address;
      if (!addr?.street || !addr?.city || !addr?.zip) {
        setErrorMsg('Street, city, and zip code are required.');
        return;
      }
    } else if (step === 3) {
      const primaryContact = formData.emergency_contacts?.[0];
      if (!primaryContact?.name || !primaryContact?.relationship || !primaryContact?.phone) {
        setErrorMsg('Primary emergency contact name, relationship, and phone are required.');
        return;
      }
    } else if (step === 4) {
      // Care needs are optional checkboxes/notes
    }

    setStep((prev) => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setErrorMsg(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const parsed = CreateClientIntakeSchema.safeParse({
        ...formData,
        org_id: orgId,
      });

      if (!parsed.success) {
        setErrorMsg(parsed.error.errors[0]?.message || 'Invalid form input');
        setIsSubmitting(false);
        return;
      }

      await onSubmit(parsed.data);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, label: 'Personal Info' },
    { id: 2, label: 'Service Address' },
    { id: 3, label: 'Emergency Contact' },
    { id: 4, label: 'Care Needs' },
    { id: 5, label: 'Payer Details' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-intake-wizard-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-8 border border-neutral-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="client-intake-wizard-title" className="text-lg font-bold text-neutral-900">New Client Intake</h2>
              <p className="text-xs text-neutral-500">Step {step} of 5: {steps[step - 1].label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ✕
          </button>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-4">
          <StepIndicator currentStep={step} steps={steps} />
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">First Name *</label>
                  <Input
                    value={formData.first_name || ''}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    placeholder="e.g. Mary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Last Name *</label>
                  <Input
                    value={formData.last_name || ''}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    placeholder="e.g. Jenkins"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Date of Birth * (YYYY-MM-DD)</label>
                  <Input
                    type="date"
                    value={formData.dob || ''}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender || 'female'}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Medicaid ID / Recipient ID</label>
                <Input
                  value={formData.medicaid_id || ''}
                  onChange={(e) => setFormData({ ...formData, medicaid_id: e.target.value })}
                  placeholder="e.g. 1234567890"
                />
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Street Address *</label>
                <Input
                  value={formData.service_address?.street || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      service_address: { ...formData.service_address!, street: e.target.value },
                    })
                  }
                  placeholder="123 Peachtree St NE"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">City *</label>
                  <Input
                    value={formData.service_address?.city || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_address: { ...formData.service_address!, city: e.target.value },
                      })
                    }
                    placeholder="Atlanta"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">State *</label>
                  <Input
                    value={formData.service_address?.state || 'GA'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_address: { ...formData.service_address!, state: e.target.value },
                      })
                    }
                    placeholder="GA"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Zip Code *</label>
                  <Input
                    value={formData.service_address?.zip || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        service_address: { ...formData.service_address!, zip: e.target.value },
                      })
                    }
                    placeholder="30303"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xs font-semibold uppercase text-neutral-400">Primary Emergency Contact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Contact Name *</label>
                  <Input
                    value={formData.emergency_contacts?.[0]?.name || ''}
                    onChange={(e) => {
                      const contacts = [...(formData.emergency_contacts || [])];
                      contacts[0] = { ...contacts[0], name: e.target.value };
                      setFormData({ ...formData, emergency_contacts: contacts });
                    }}
                    placeholder="e.g. Robert Jenkins"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Relationship *</label>
                  <Input
                    value={formData.emergency_contacts?.[0]?.relationship || ''}
                    onChange={(e) => {
                      const contacts = [...(formData.emergency_contacts || [])];
                      contacts[0] = { ...contacts[0], relationship: e.target.value };
                      setFormData({ ...formData, emergency_contacts: contacts });
                    }}
                    placeholder="e.g. Son / Healthcare Proxy"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Phone Number *</label>
                <Input
                  value={formData.emergency_contacts?.[0]?.phone || ''}
                  onChange={(e) => {
                    const contacts = [...(formData.emergency_contacts || [])];
                    contacts[0] = { ...contacts[0], phone: e.target.value };
                    setFormData({ ...formData, emergency_contacts: contacts });
                  }}
                  placeholder="404-555-0199"
                />
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">Primary Clinical Diagnosis</label>
                <Input
                  value={formData.care_needs?.primary_diagnosis || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      care_needs: { ...formData.care_needs!, primary_diagnosis: e.target.value },
                    })
                  }
                  placeholder="e.g. Dementia, Post-stroke hemiparesis"
                />
              </div>

              <div className="space-y-2 pt-2">
                <span className="block text-xs font-semibold text-neutral-700">Activities of Daily Living (ADL) Support</span>
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.care_needs?.mobility_assistance || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        care_needs: { ...formData.care_needs!, mobility_assistance: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Mobility & Transfer Assistance
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.care_needs?.bathing_dressing || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        care_needs: { ...formData.care_needs!, bathing_dressing: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Bathing & Personal Hygiene Dressing
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.care_needs?.meal_prep || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        care_needs: { ...formData.care_needs!, meal_prep: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Nutritional Meal Preparation
                </label>
                <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.care_needs?.medication_reminders || false}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        care_needs: { ...formData.care_needs!, medication_reminders: e.target.checked },
                      })
                    }
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Medication Reminders
                </label>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Payer Name *</label>
                  <Input
                    value={formData.payer_details?.payer_name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payer_details: { ...formData.payer_details!, payer_name: e.target.value },
                      })
                    }
                    placeholder="e.g. Amerigroup / Peach State"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Plan / Waiver Type *</label>
                  <Input
                    value={formData.payer_details?.plan_type || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payer_details: { ...formData.payer_details!, plan_type: e.target.value },
                      })
                    }
                    placeholder="e.g. CCSP / SOURCE"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Care Coordinator Name</label>
                  <Input
                    value={formData.payer_details?.coordinator_name || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payer_details: { ...formData.payer_details!, coordinator_name: e.target.value },
                      })
                    }
                    placeholder="Case Manager Name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Coordinator Phone</label>
                  <Input
                    value={formData.payer_details?.coordinator_phone || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        payer_details: { ...formData.payer_details!, coordinator_phone: e.target.value },
                      })
                    }
                    placeholder="404-555-0123"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between">
          <Button
            variant="secondary"
            onClick={step === 1 ? onClose : handlePrev}
            disabled={isSubmitting}
            className="flex items-center gap-1"
          >
            {step === 1 ? 'Cancel' : <><ArrowLeft className="w-4 h-4" /> Back</>}
          </Button>

          {step < 5 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center gap-1"
            >
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'Creating...' : <><CheckCircle2 className="w-4 h-4" /> Submit Intake</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
