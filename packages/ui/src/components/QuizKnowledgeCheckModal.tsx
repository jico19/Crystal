import React, { useState } from 'react';
import type { QuizQuestion } from '@crystal/types';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { Award, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';

export interface QuizKnowledgeCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleTitle: string;
  questions: QuizQuestion[];
  passingScorePct: number;
  onSubmit: (answers: Record<string, number>) => Promise<{
    passed: boolean;
    score_percentage: number;
    incorrect_question_ids: string[];
    certificate_hash?: string | null;
  }>;
  onViewCertificate?: () => void;
}

export const QuizKnowledgeCheckModal: React.FC<QuizKnowledgeCheckModalProps> = ({
  isOpen,
  onClose,
  moduleTitle,
  questions,
  passingScorePct,
  onSubmit,
  onViewCertificate,
}) => {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    score_percentage: number;
    incorrect_question_ids: string[];
    certificate_hash?: string | null;
  } | null>(null);

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert('Please answer all questions before submitting.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await onSubmit(answers);
      setResult(res);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
  };

  const allAnswered = Object.keys(answers).length === questions.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Knowledge Check: ${moduleTitle}`}
      description={`Passing grade: ${passingScorePct}% minimum required for state certificate.`}
      maxWidth="xl"
    >
      {!result ? (
        <div className="space-y-6 py-2">
          {questions.map((q, idx) => (
            <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
              <div className="text-sm font-semibold text-slate-900 flex items-start gap-2">
                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {idx + 1}
                </span>
                <span>{q.question}</span>
              </div>

              <div className="space-y-2 pl-7">
                {q.options.map((opt, optIdx) => {
                  const isSelected = answers[q.id] === optIdx;
                  return (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50/60 text-primary-900 font-medium'
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(q.id, optIdx)}
                        className="text-primary-600 focus:ring-primary-500"
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="pt-4 flex items-center justify-between border-t border-slate-100">
            <span className="text-xs text-slate-500">
              {Object.keys(answers).length} of {questions.length} answered
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                disabled={!allAnswered}
              >
                Submit Answers
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Result Screen */
        <div className="py-6 text-center space-y-5">
          <div
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
              result.passed ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {result.passed ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <AlertCircle className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {result.passed ? 'Congratulations! You Passed' : 'Knowledge Check Not Passed'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your Score: <strong className="text-slate-900 text-sm">{result.score_percentage}%</strong> (Required:{' '}
              {passingScorePct}%)
            </p>
          </div>

          {result.passed ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                <Award className="w-4 h-4 text-emerald-600" />
                Certificate Generated & Signed
              </div>
              <p className="text-[11px] text-emerald-700">
                A verified training certificate with cryptographic SHA-256 tamper digest has been issued to your profile.
              </p>
              {result.certificate_hash && (
                <div className="font-mono text-[10px] bg-white p-2 rounded border border-emerald-200 text-emerald-800 break-all">
                  SHA-256: {result.certificate_hash}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-left text-xs text-red-800 space-y-1">
              <p className="font-semibold">Review Recommendations:</p>
              <p className="text-[11px] text-red-700">
                You missed {result.incorrect_question_ids.length} question(s). You can review the video lesson and retake the quiz at any time.
              </p>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-3">
            {!result.passed ? (
              <Button
                variant="primary"
                onClick={handleRetake}
                leftIcon={<RotateCcw className="w-4 h-4" />}
              >
                Retake Quiz
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={onClose}>
                  Done
                </Button>
                {onViewCertificate && (
                  <Button
                    variant="primary"
                    onClick={onViewCertificate}
                    leftIcon={<Award className="w-4 h-4" />}
                  >
                    View Official Certificate
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
