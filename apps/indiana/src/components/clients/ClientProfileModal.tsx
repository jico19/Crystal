import React, { useState } from 'react';
import type { ClientProfile, ClientDocument, ClientStatus, ClientDocCategory } from '@crystal/types';
import { Badge, Button } from '@crystal/ui';
import { Phone, MapPin, HeartPulse, FileText, Upload, Shield } from 'lucide-react';

export interface ClientProfileModalProps {
  client: ClientProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (clientId: string, newStatus: ClientStatus) => Promise<void>;
  documents: ClientDocument[];
  onUploadDoc: (clientId: string, category: ClientDocCategory, file: File) => Promise<void>;
}

export const ClientProfileModal: React.FC<ClientProfileModalProps> = ({
  client,
  isOpen,
  onClose,
  onStatusChange,
  documents,
  onUploadDoc,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'documents'>('profile');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedDocCategory, setSelectedDocCategory] = useState<ClientDocCategory>('assessment_485');
  const [isUploading, setIsUploading] = useState(false);

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

  if (!isOpen || !client) return null;

  const handleStatusUpdate = async (status: ClientStatus) => {
    setIsUpdatingStatus(true);
    try {
      await onStatusChange(client.id, status);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onUploadDoc(client.id, selectedDocCategory, file);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-profile-modal-title"
        className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden my-8 border border-neutral-200"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
              {client.first_name[0]}{client.last_name[0]}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="client-profile-modal-title" className="text-lg font-bold text-neutral-900">
                  {client.first_name} {client.last_name}
                </h2>
                <Badge variant={client.status === 'active' ? 'success' : 'warning'} size="sm">
                  {client.status.toUpperCase()}
                </Badge>
              </div>
              <p className="text-xs text-neutral-500 font-mono">
                Medicaid ID: {client.medicaid_id || 'N/A'} • DOB: {client.dob}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={client.status}
              disabled={isUpdatingStatus}
              onChange={(e) => handleStatusUpdate(e.target.value as ClientStatus)}
              className="text-xs font-semibold px-2.5 py-1.5 border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="intake_draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="discharged">Discharged</option>
            </select>
            <button
              onClick={onClose}
              aria-label="Close"
              className="text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 px-6 bg-neutral-50/50">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Clinical & Demographics
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-neutral-500 hover:text-neutral-700'
            }`}
          >
            Clinical Documents ({documents.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Service Address */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 mb-2 uppercase">
                  <MapPin className="w-4 h-4 text-neutral-400" /> Service Address
                </div>
                <div className="text-sm text-neutral-800">
                  {client.service_address?.street || 'No street specified'}<br />
                  {client.service_address?.city}, {client.service_address?.state} {client.service_address?.zip}
                </div>
              </div>

              {/* Emergency Contacts */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 mb-2 uppercase">
                  <Phone className="w-4 h-4 text-neutral-400" /> Emergency Contacts
                </div>
                <div className="space-y-2">
                  {client.emergency_contacts?.map((c, i) => (
                    <div key={i} className="text-sm text-neutral-800 flex justify-between items-center bg-white p-2.5 rounded-lg border border-neutral-200">
                      <div>
                        <span className="font-semibold">{c.name}</span> ({c.relationship})
                        {c.is_primary && <Badge variant="info" size="sm" className="ml-2">Primary</Badge>}
                      </div>
                      <span className="font-mono text-xs text-neutral-600">{c.phone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Care Needs */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 mb-2 uppercase">
                  <HeartPulse className="w-4 h-4 text-rose-500" /> Care Needs & Diagnosis
                </div>
                <div className="text-sm font-semibold text-neutral-900 mb-2">
                  Primary Diagnosis: {client.care_needs?.primary_diagnosis || 'Unspecified'}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-700">
                  <div className="flex items-center gap-1.5">
                    <span className={client.care_needs?.mobility_assistance ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>
                      {client.care_needs?.mobility_assistance ? '✓' : '—'}
                    </span>
                    Mobility Assistance
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={client.care_needs?.bathing_dressing ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>
                      {client.care_needs?.bathing_dressing ? '✓' : '—'}
                    </span>
                    Bathing / Dressing
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={client.care_needs?.meal_prep ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>
                      {client.care_needs?.meal_prep ? '✓' : '—'}
                    </span>
                    Meal Preparation
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={client.care_needs?.medication_reminders ? 'text-emerald-600 font-bold' : 'text-neutral-400'}>
                      {client.care_needs?.medication_reminders ? '✓' : '—'}
                    </span>
                    Medication Reminders
                  </div>
                </div>
              </div>

              {/* Payer Details */}
              <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-neutral-700 mb-2 uppercase">
                  <Shield className="w-4 h-4 text-neutral-400" /> Payer & Waiver Plan
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-neutral-500 block">Payer Name</span>
                    <span className="font-semibold text-neutral-900">{client.payer_details?.payer_name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 block">Plan Type</span>
                    <span className="font-semibold text-neutral-900">{client.payer_details?.plan_type}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 block">Case Coordinator</span>
                    <span className="text-neutral-800">{client.payer_details?.coordinator_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-neutral-500 block">Coordinator Phone</span>
                    <span className="text-neutral-800">{client.payer_details?.coordinator_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              {/* Upload control */}
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 flex flex-col sm:flex-row items-center gap-3">
                <select
                  value={selectedDocCategory}
                  onChange={(e) => setSelectedDocCategory(e.target.value as ClientDocCategory)}
                  className="px-3 py-2 text-xs font-semibold bg-white border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="assessment_485">Form 485 / Plan of Care</option>
                  <option value="physician_order">Physician Order</option>
                  <option value="consent_packet">Consent Packet</option>
                  <option value="insurance_card">Insurance Card</option>
                  <option value="face_sheet">Face Sheet</option>
                </select>

                <label className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  {isUploading ? 'Uploading...' : 'Upload Document'}
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploading}
                    onChange={handleFileUpload}
                  />
                </label>
              </div>

              {/* Documents table */}
              <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
                {documents.length === 0 ? (
                  <div className="p-8 text-center text-sm text-neutral-400">
                    No clinical documents uploaded yet for this client.
                  </div>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="p-3 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-neutral-400" />
                        <div>
                          <div className="text-sm font-semibold text-neutral-800">{doc.file_name}</div>
                          <div className="text-xs text-neutral-400 uppercase tracking-wider">
                            {doc.category.replace('_', ' ')} • Uploaded {new Date(doc.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="success" size="sm">Active</Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
