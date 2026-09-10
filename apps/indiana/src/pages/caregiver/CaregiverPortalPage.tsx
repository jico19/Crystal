import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ComplianceScoreBanner } from '../../components/documents/ComplianceScoreBanner.js';
import { DocumentChecklistTable, DocumentRowItem } from '../../components/documents/DocumentChecklistTable.js';
import { DocumentUploadModal } from '../../components/documents/DocumentUploadModal.js';
import { TrainingPortalCatalog, EnrichedTrainingModule } from '../../components/training/TrainingPortalCatalog.js';
import { VideoPlayerWithProgress } from '../../components/training/VideoPlayerWithProgress.js';
import { QuizKnowledgeCheckModal } from '../../components/training/QuizKnowledgeCheckModal.js';
import { CertificateModal } from '../../components/training/CertificateModal.js';
import type { ComplianceScore, DocumentCategory, CaregiverDocument, CertificateDetails } from '@crystal/types';
import { FileText, GraduationCap, Loader2, AlertCircle, RefreshCw, Download, Megaphone, ShieldCheck } from 'lucide-react';
import { DashboardPageHeader, DashboardTabs } from '@crystal/ui';

const STANDARD_DOCUMENT_CHECKLIST: Array<{
  category: DocumentCategory;
  label: string;
  description: string;
  isMandatory: boolean;
}> = [
  {
    category: 'drivers_license',
    label: "Driver's License / Photo ID",
    description: 'Government-issued photo identification (State Driver’s License or ID Card)',
    isMandatory: true,
  },
  {
    category: 'social_security_card',
    label: 'Social Security Card',
    description: 'Signed official Social Security Administration card or proof of work authorization',
    isMandatory: true,
  },
  {
    category: 'cpr_first_aid',
    label: 'CPR & First Aid Certification',
    description: 'Current AHA or Red Cross hands-on BLS/CPR & First Aid certification card',
    isMandatory: true,
  },
  {
    category: 'tb_test_screen',
    label: 'TB (Tuberculosis) Screening',
    description: 'Negative 2-step PPD, Quantiferon blood test, or symptom screen within 12 months',
    isMandatory: true,
  },
  {
    category: 'background_check_report',
    label: 'Criminal Background Check Clearance',
    description: 'State and federal fingerprint-based criminal history record check (CHOW / IdentoGO)',
    isMandatory: true,
  },
  {
    category: 'cna_hha_license',
    label: 'CNA / HHA Professional License',
    description: 'Active state registry certification listing or healthcare credential (if applicable)',
    isMandatory: true,
  },
  {
    category: 'w4_i9_form',
    label: 'W-4 & Form I-9 Verification',
    description: 'Federal tax withholding allowance certificate and employment eligibility verification',
    isMandatory: true,
  },
  {
    category: 'auto_insurance',
    label: 'Automobile Liability Insurance',
    description: 'Current personal auto insurance policy declaration page (for driving staff)',
    isMandatory: false,
  },
  {
    category: 'physical_exam',
    label: 'Pre-Employment Physical Examination',
    description: 'Medical practitioner clearance verifying fitness for direct patient care duties',
    isMandatory: false,
  },
];

export const CaregiverPortalPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'documents' | 'training'>('documents');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile state
  const [profile, setProfile] = useState<any | null>(null);

  // Documents state
  const [score, setScore] = useState<ComplianceScore>({
    total_required: 7,
    total_approved: 0,
    total_pending: 0,
    total_rejected: 0,
    total_expired: 0,
    compliance_percentage: 0,
    is_compliant: false,
  });

  const [documentItems, setDocumentItems] = useState<DocumentRowItem[]>(
    STANDARD_DOCUMENT_CHECKLIST.map((item) => ({
      ...item,
      document: undefined,
    }))
  );

  const [selectedUploadCategory, setSelectedUploadCategory] = useState<DocumentCategory | null>(null);

  // Training state
  const [modules, setModules] = useState<EnrichedTrainingModule[]>([]);
  const [activeModule, setActiveModule] = useState<EnrichedTrainingModule | null>(null);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<CertificateDetails | null>(null);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const loadDocumentsAndCompliance = useCallback(async (caregiverId: string, token: string) => {
    try {
      const [docsRes, compRes] = await Promise.all([
        fetch(`${apiUrl}/api/v1/documents/caregiver/${caregiverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/v1/documents/caregiver/${caregiverId}/compliance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (docsRes.ok) {
        const docsJson = await docsRes.json();
        const rawDocs = docsJson.data?.documents ?? docsJson.data ?? [];
        const uploadedDocs: CaregiverDocument[] = Array.isArray(rawDocs) ? rawDocs : [];
        setDocumentItems(
          STANDARD_DOCUMENT_CHECKLIST.map((cfg) => {
            const foundDoc = uploadedDocs.find((d) => d.category === cfg.category);
            return {
              ...cfg,
              document: foundDoc,
            };
          })
        );
      }

      if (compRes.ok) {
        const compJson = await compRes.json();
        const scoreData = compJson.data?.score ?? compJson.data;
        if (scoreData) {
          setScore(scoreData);
        }
      }
    } catch (err) {
      console.error('Failed to load caregiver documents/compliance:', err);
    }
  }, [apiUrl]);

  const loadTrainingModules = useCallback(async (caregiverId: string, token: string) => {
    try {
      const res = await fetch(`${apiUrl}/api/v1/training/modules?caregiverId=${caregiverId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.modules) {
          setModules(json.data.modules);
        }
      }
    } catch (err) {
      console.error('Failed to load training modules:', err);
    }
  }, [apiUrl]);

  const loadPortalData = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const token = localStorage.getItem('crystal_jwt');
      if (!token) {
        setErrorMessage('No authenticated caregiver session found. Please submit your application first.');
        setIsLoading(false);
        return;
      }

      // 1. Fetch Caregiver Profile
      const profRes = await fetch(`${apiUrl}/api/v1/caregivers/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!profRes.ok) {
        if (profRes.status === 401) {
          setErrorMessage('Session expired or unauthorized. Please re-login or submit your application.');
        } else {
          setErrorMessage('Caregiver profile not found for this account.');
        }
        setIsLoading(false);
        return;
      }

      const profJson = await profRes.json();
      const caregiverProfile = profJson.data;
      setProfile(caregiverProfile);

      if (caregiverProfile?.id) {
        await Promise.all([
          loadDocumentsAndCompliance(caregiverProfile.id, token),
          loadTrainingModules(caregiverProfile.id, token),
        ]);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to connect to API server.');
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, loadDocumentsAndCompliance, loadTrainingModules]);

  useEffect(() => {
    loadPortalData();
  }, [loadPortalData]);

  // Handle document upload
  const handleDocumentUpload = async (file: File, expDate?: string, hasNoExp?: boolean) => {
    if (!selectedUploadCategory || !profile) return;
    const token = localStorage.getItem('crystal_jwt');
    if (!token) return;

    try {
      // 1. Request presigned upload URL
      const presignRes = await fetch(`${apiUrl}/api/v1/documents/upload-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caregiver_id: profile.id,
          category: selectedUploadCategory,
          file_name: file.name,
          file_size_bytes: file.size,
          mime_type: file.type || 'application/pdf',
          expiration_date: hasNoExp ? undefined : expDate || undefined,
        }),
      });

      const presignJson = await presignRes.json();
      if (!presignRes.ok || !presignJson.success) {
        throw new Error(presignJson.error || 'Failed to initialize document upload.');
      }

      const { uploadUrl } = presignJson.data;

      // 2. Stream raw file binary to storage provider
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
        },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error('Failed to transfer file data to storage adapter.');
      }

      // 3. Refresh documents checklist and compliance score
      await loadDocumentsAndCompliance(profile.id, token);
      setSelectedUploadCategory(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'An error occurred while uploading the document.');
    }
  };

  // View document download
  const handleViewDocument = async (docId: string) => {
    try {
      const token = localStorage.getItem('crystal_jwt');
      const res = await fetch(`${apiUrl}/api/v1/documents/${docId}/download-url`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data?.downloadUrl) {
        window.open(json.data.downloadUrl, '_blank');
      } else {
        alert(json.error || 'Failed to generate secure preview URL.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error retrieving document preview.');
    }
  };

  // Video progress reporting
  const handleVideoProgress = async (watchedSeconds: number, deltaSeconds: number) => {
    if (!activeModule || !profile) return;
    try {
      const token = localStorage.getItem('crystal_jwt');
      await fetch(`${apiUrl}/api/v1/training/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          caregiver_id: profile.id,
          module_id: activeModule.id,
          watched_seconds: watchedSeconds,
          delta_seconds: deltaSeconds,
        }),
      });
    } catch (err) {
      console.error('Failed to report video progress:', err);
    }
  };

  // Quiz submission
  const handleQuizSubmit = async (answers: Record<string, number>) => {
    if (!activeModule || !profile) {
      throw new Error('No active module session found.');
    }
    const token = localStorage.getItem('crystal_jwt');
    const res = await fetch(`${apiUrl}/api/v1/training/quiz/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        caregiver_id: profile.id,
        module_id: activeModule.id,
        answers,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.error || 'Quiz evaluation failed.');
    }

    // Refresh training modules catalog
    if (token) {
      await loadTrainingModules(profile.id, token);
    }

    return json.data;
  };

  // View certificate
  const handleViewCertificate = async (progressId: string) => {
    try {
      const token = localStorage.getItem('crystal_jwt');
      const res = await fetch(`${apiUrl}/api/v1/training/certificates/${progressId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success && json.data?.certificate) {
        setSelectedCert(json.data.certificate);
      } else {
        alert(json.error || 'Failed to retrieve verified certificate.');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error fetching certificate.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        <p className="text-sm font-medium">Loading live caregiver credentials & training records...</p>
      </div>
    );
  }

  const handleQuickDemoLogin = async () => {
    try {
      setIsLoading(true);
      const isIndiana = window.location.port === '5174';
      const demoEmail = isIndiana ? 'caregiver.in@cherishopenarms.com' : 'caregiver.ga@withopenhands.com';
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: demoEmail, password: 'Password123!' }),
      });
      const json = await res.json();
      if (json.success && json.data?.token) {
        localStorage.setItem('crystal_jwt', json.data.token);
        localStorage.setItem('crystal_user', JSON.stringify(json.data.user));
        await loadPortalData();
      } else {
        throw new Error(json.error || 'Demo login failed');
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Demo login failed');
      setIsLoading(false);
    }
  };

  if (errorMessage && !profile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-5">
        <div className="inline-flex p-3.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white">Caregiver Session Required</h2>
          <p className="text-sm text-slate-400 max-w-md mx-auto">{errorMessage}</p>
        </div>
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleQuickDemoLogin}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-teal-950/40 transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>1-Click Caregiver Demo Sign-In</span>
          </button>
          <Link
            to="/auth/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Go to Portal Login</span>
          </Link>
          <button
            onClick={loadPortalData}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-300 border border-slate-800 rounded-xl text-xs font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const portalTabs = [
    { id: 'documents', label: 'Credentials & Documents', icon: FileText, count: documentItems.filter((d) => d.document?.verification_status === 'approved').length },
    { id: 'training', label: 'In-Service Training Portal', icon: GraduationCap, count: modules.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in text-white">
      {/* Unified Page Header */}
      <DashboardPageHeader
        title="Caregiver Operations & Onboarding Portal"
        subtitle="Maintain your compliance credentials, track verification status, and complete mandatory state in-service training."
        icon={FileText}
        roleBadge={{ text: 'Caregiver Staff', variant: 'purple' }}
        stateBadge={{ code: profile?.state_code || 'IN' }}
        statusPill={{
          text: profile?.application_status === 'approved' ? 'Active Credentialed' : 'Compliance Tracking',
          dotColor: profile?.application_status === 'approved' ? 'emerald' : 'amber',
        }}
        actions={
          <a
            href={`${apiUrl}/api/v1/caregivers/packet/download?state_code=${profile?.state_code || 'IN'}`}
            download
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition cursor-pointer"
            title="Download blank employment application packet and checklists"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Download Employment Packet</span>
          </a>
        }
      />

      {/* Agency Announcements Banner */}
      <div className="p-4 rounded-2xl bg-teal-950/40 border border-teal-800/40 flex items-start gap-3 shadow-md">
        <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 shrink-0 mt-0.5">
          <Megaphone className="w-4 h-4" />
        </div>
        <div className="flex-1 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-teal-200">Company Announcement: Clinical Safety & Credential Compliance</span>
            <span className="text-[10px] text-teal-400/90 font-semibold px-2 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/30">Active Notice</span>
          </div>
          <p className="text-teal-300/80 leading-relaxed">
            All active caregivers must ensure CPR certifications and annual TB screenings are renewed at least 15 days prior to expiration to maintain active shift scheduling eligibility. Please reach out to your clinical coordinator with questions.
          </p>
        </div>
      </div>

      {/* Application Status Banner */}
      {profile && (
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-white">
                  {profile.personal_info?.first_name} {profile.personal_info?.last_name}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  (Ref: {profile.id?.slice(0, 8)}...)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {profile.personal_info?.email} • {profile.personal_info?.phone} • {profile.state_code} Jurisdiction
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400 font-medium">Application Status:</span>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  profile.application_status === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : profile.application_status === 'submitted'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : profile.application_status === 'under_review'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-700/50 text-slate-300 border border-slate-600'
                }`}
              >
                {profile.application_status === 'submitted'
                  ? 'Submitted: Under Clinical Review'
                  : profile.application_status === 'under_review'
                  ? 'Under Review'
                  : profile.application_status}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block">Position(s) Applied:</span>
              <span className="text-white font-semibold mt-1 block">
                {profile.positions_applied?.length
                  ? profile.positions_applied.map((p: string) => p.toUpperCase()).join(', ')
                  : 'Direct Care Staff'}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block">Application Progress:</span>
              <span className="text-white font-semibold mt-1 block">
                {profile.application_status === 'submitted'
                  ? 'All 5 Steps Completed'
                  : `Step ${profile.application_step} of 5`}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
              <span className="text-slate-400 block">Current Stage:</span>
              <span className="text-teal-400 font-semibold mt-1 block">
                Credential Upload & Training Portal
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Unified Tab Navigation */}
      <div className="flex items-center justify-start border-b border-slate-800 pb-4">
        <DashboardTabs
          tabs={portalTabs}
          activeTab={activeTab}
          onChange={(tabId) => setActiveTab(tabId as any)}
        />
      </div>

      {/* Tab 1: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <ComplianceScoreBanner score={score} />
          <DocumentChecklistTable
            items={documentItems}
            onUploadClick={(cat) => setSelectedUploadCategory(cat)}
            onViewClick={handleViewDocument}
          />
        </div>
      )}

      {/* Tab 2: Training */}
      {activeTab === 'training' && (
        <div className="space-y-6">
          {activeModule ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">
                  Currently Watching: {activeModule.title}
                </h2>
                <button
                  onClick={() => setActiveModule(null)}
                  className="text-xs text-teal-400 hover:underline font-medium"
                >
                  ← Back to Course Catalog
                </button>
              </div>
              <VideoPlayerWithProgress
                module={activeModule}
                initialWatchSeconds={activeModule.progress?.watch_progress_seconds || 0}
                onProgressUpdate={handleVideoProgress}
                onUnlockQuiz={() => setIsQuizModalOpen(true)}
              />
            </div>
          ) : (
            <TrainingPortalCatalog
              modules={modules}
              onStartModule={(m) => setActiveModule(m)}
              onViewCertificate={(progId) => handleViewCertificate(progId)}
            />
          )}
        </div>
      )}

      {/* Document Upload Modal */}
      {selectedUploadCategory && (
        <DocumentUploadModal
          isOpen={!!selectedUploadCategory}
          onClose={() => setSelectedUploadCategory(null)}
          category={selectedUploadCategory}
          categoryLabel={selectedUploadCategory.replace(/_/g, ' ').toUpperCase()}
          onUpload={handleDocumentUpload}
        />
      )}

      {/* Quiz Modal */}
      {activeModule && (
        <QuizKnowledgeCheckModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          moduleId={activeModule.id}
          moduleTitle={activeModule.title}
          questions={activeModule.quiz_questions}
          passingScorePct={activeModule.passing_score_pct}
          onSubmit={handleQuizSubmit}
          onViewCertificate={async () => {
            setIsQuizModalOpen(false);
            if (profile) {
              const token = localStorage.getItem('crystal_jwt');
              if (token) {
                const res = await fetch(`${apiUrl}/api/v1/training/modules?caregiverId=${profile.id}`, {
                  headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                  const json = await res.json();
                  const freshModule = json.data?.modules?.find((m: any) => m.id === activeModule.id);
                  if (freshModule?.progress?.id) {
                    await handleViewCertificate(freshModule.progress.id);
                  }
                }
              }
            }
          }}
        />
      )}

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
      />
    </div>
  );
};
