'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { VideoPlayerWithProgress, QuizKnowledgeCheckModal, CertificateModal } from '@crystal/ui';
import type { TrainingModule, QuizResultResponse } from '@crystal/types';

interface IndianaLessonClientProps {
  moduleId: string;
}

export function IndianaLessonClient({ moduleId }: IndianaLessonClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldOpenQuiz = searchParams.get('quiz') === 'true';

  const [moduleData, setModuleData] = useState<TrainingModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [caregiverId, setCaregiverId] = useState('');
  const [isQuizOpen, setIsQuizOpen] = useState(shouldOpenQuiz);
  const [certHash, setCertHash] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  useEffect(() => {
    let storedId = localStorage.getItem('crystal_caregiver_guest_id_in');
    if (!storedId) {
      storedId = `in-applicant-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      localStorage.setItem('crystal_caregiver_guest_id_in', storedId);
    }
    setCaregiverId(storedId);

    const fetchModule = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/api/v1/training/modules/${moduleId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) setModuleData(json.module);
        }
      } catch (err) {
        console.warn('Failed to fetch module:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [moduleId, apiBaseUrl]);

  if (loading || !moduleData) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">Loading lesson stream...</p>
      </div>
    );
  }

  const handleProgressUpdate = async (seconds: number, totalDuration: number) => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/training/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caregiver_id: caregiverId,
          module_id: moduleId,
          watch_progress_seconds: Math.round(seconds),
          total_duration_seconds: totalDuration,
        }),
      });
    } catch {
      // Background heartbeat
    }
  };

  const handleQuizSubmit = async (
    answers: Array<{ question_id: string; selected_index: number }>
  ): Promise<QuizResultResponse> => {
    const res = await fetch(`${apiBaseUrl}/api/v1/training/quiz/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        caregiver_id: caregiverId,
        module_id: moduleId,
        answers,
      }),
    });
    return res.json();
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <button
          onClick={() => router.push('/training')}
          className="hover:text-slate-900 font-medium transition-colors"
        >
          &larr; Back to Course Catalog
        </button>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate">{moduleData.title}</span>
      </div>

      {/* Video Lesson Player with Anti-Skipping */}
      <VideoPlayerWithProgress
        module={moduleData}
        caregiverId={caregiverId}
        onProgressUpdate={handleProgressUpdate}
        onTakeQuiz={() => setIsQuizOpen(true)}
      />

      {/* Course Overview & Transcript Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 mb-4">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase tracking-wider">
              {moduleData.category.replace('_', ' ')}
            </span>
            <h1 className="text-xl font-bold text-slate-900 mt-2">{moduleData.title}</h1>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-500 block">Accreditation Value</span>
            <span className="font-bold text-slate-900 text-sm">{moduleData.required_hours} CEU Hours</span>
          </div>
        </div>

        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Lesson Overview & Syllabus</h4>
        <p className="text-sm text-slate-600 leading-relaxed">{moduleData.description}</p>
      </div>

      {/* Interactive Quiz Modal */}
      <QuizKnowledgeCheckModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        moduleTitle={moduleData.title}
        passingScorePercentage={moduleData.passing_score_percentage}
        questions={moduleData.quiz_questions}
        onSubmitQuiz={handleQuizSubmit}
        onViewCertificate={(hash) => {
          setIsQuizOpen(false);
          setCertHash(hash);
        }}
      />

      {/* Certificate Modal */}
      {certHash && (
        <CertificateModal
          isOpen={Boolean(certHash)}
          onClose={() => setCertHash(null)}
          caregiverName="Caregiver Trainee"
          moduleTitle={moduleData.title}
          hoursCredited={moduleData.required_hours}
          completedAt={new Date().toISOString()}
          certificateHash={certHash}
          organizationName="Cherish Open Arms Home Care"
          stateCode="IN"
        />
      )}
    </div>
  );
}
