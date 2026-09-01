'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ComplianceScoreBanner,
  DocumentChecklistTable,
  DocumentUploadModal,
} from '@crystal/ui';
import type {
  CaregiverDocument,
  ComplianceScore,
  DocumentCategoryType,
} from '@crystal/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface IndianaDocumentsClientProps {
  orgId: string;
}

export function IndianaDocumentsClient({ orgId }: IndianaDocumentsClientProps) {
  const searchParams = useSearchParams();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const caregiverId =
    searchParams.get('user_id') ||
    searchParams.get('caregiver_id') ||
    (typeof window !== 'undefined' ? localStorage.getItem('crystal_caregiver_guest_id_in') : null) ||
    'in-caregiver-demo-01';

  const [documents, setDocuments] = useState<CaregiverDocument[]>([]);
  const [score, setScore] = useState<ComplianceScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<DocumentCategoryType>('cpr_first_aid');

  const fetchData = useCallback(async () => {
    try {
      const [docsRes, scoreRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/v1/caregivers/documents?caregiver_id=${encodeURIComponent(caregiverId)}`),
        fetch(`${apiBaseUrl}/api/v1/caregivers/documents/compliance-score?caregiver_id=${encodeURIComponent(caregiverId)}`),
      ]);

      if (docsRes.ok) {
        const json = await docsRes.json();
        setDocuments(json.documents || []);
      }

      if (scoreRes.ok) {
        const json = await scoreRes.json();
        setScore(json.compliance_score || null);
      }
    } catch (err) {
      console.warn('[IndianaDocumentsClient] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, caregiverId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUploadClick = (category: DocumentCategoryType) => {
    setSelectedCategory(category);
    setUploadModalOpen(true);
  };

  const handleReviewSubmit = async (
    documentId: string,
    decision: 'approved' | 'rejected',
    reason?: string
  ) => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/caregivers/documents/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': caregiverId,
        },
        body: JSON.stringify({
          document_id: documentId,
          decision,
          rejection_reason: reason,
        }),
      });
      await fetchData();
    } catch (err) {
      console.error('[Review Submit Error]:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Link
        href="/apply/status"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Onboarding Status
      </Link>

      {/* Compliance Score Banner */}
      {score && (
        <ComplianceScoreBanner
          score={score}
          onUploadMissing={() => {
            if (score.missing_categories.length > 0) {
              handleUploadClick(score.missing_categories[0]);
            }
          }}
        />
      )}

      {/* Credential Checklist Table */}
      <DocumentChecklistTable
        documents={documents}
        onUploadClick={handleUploadClick}
        onReviewSubmit={handleReviewSubmit}
        isCoordinatorView={true}
      />

      {/* Upload Modal */}
      <DocumentUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        caregiverId={caregiverId}
        orgId={orgId}
        apiBaseUrl={apiBaseUrl}
        initialCategory={selectedCategory}
        onUploadSuccess={() => {
          fetchData();
        }}
      />
    </div>
  );
}
