'use client';

import React, { useState } from 'react';
import type { QuizQuestion, QuizResultResponse } from '@crystal/types';

export interface QuizKnowledgeCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleTitle: string;
  passingScorePercentage: number;
  questions: QuizQuestion[];
  onSubmitQuiz: (answers: Array<{ question_id: string; selected_index: number }>) => Promise<QuizResultResponse>;
  onViewCertificate?: (hash: string) => void;
}

export const QuizKnowledgeCheckModal: React.FC<QuizKnowledgeCheckModalProps> = ({
  isOpen,
  onClose,
  moduleTitle,
  passingScorePercentage,
  questions,
  onSubmitQuiz,
  onViewCertificate,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<QuizResultResponse | null>(null);

  if (!isOpen) return null;

  const handleOptionSelect = (questionId: string, optionIndex: number) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const answeredCount = Object.keys(selectedAnswers).length;
  const isComplete = answeredCount === questions.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete) {
      setErrorMsg('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);
      const answersPayload = questions.map((q) => ({
        question_id: q.id,
        selected_index: selectedAnswers[q.id],
      }));

      const res = await onSubmitQuiz(answersPayload);
      setQuizResult(res);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'An error occurred submitting the quiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSelectedAnswers({});
    setQuizResult(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">
              End-of-Module Knowledge Check
            </span>
            <h3 className="text-lg font-bold truncate max-w-md">{moduleTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {quizResult ? (
            /* Result View */
            <div className="text-center py-6">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4 ${
                  quizResult.passed
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-rose-100 text-rose-600'
                }`}
              >
                {quizResult.passed ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <h4 className="text-2xl font-bold text-slate-900 mb-1">
                {quizResult.passed ? 'Knowledge Check Passed!' : 'Knowledge Check Not Passed'}
              </h4>
              <p className="text-sm text-slate-600 mb-4">{quizResult.message}</p>

              <div className="inline-flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-sm mb-6">
                <div>
                  <span className="text-slate-500 block text-xs">Your Score</span>
                  <span className={`font-bold text-lg ${quizResult.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {quizResult.score_percentage}%
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-500 block text-xs">Passing Requirement</span>
                  <span className="font-bold text-lg text-slate-800">
                    {passingScorePercentage}%
                  </span>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                  <span className="text-slate-500 block text-xs">Correct Answers</span>
                  <span className="font-bold text-lg text-slate-800">
                    {quizResult.correct_count} / {quizResult.total_questions}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3">
                {quizResult.passed ? (
                  <>
                    {quizResult.certificate_hash && onViewCertificate && (
                      <button
                        onClick={() => onViewCertificate(quizResult.certificate_hash!)}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        View & Download Certificate
                      </button>
                    )}
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleRetry}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md transition-all flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Retake Quiz
                    </button>
                    <button
                      onClick={onClose}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
                    >
                      Return to Video
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Quiz Questions Form */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex items-center justify-between text-xs text-indigo-900">
                <span>Passing Grade: <strong>{passingScorePercentage}%</strong></span>
                <span>Questions Answered: <strong>{answeredCount} of {questions.length}</strong></span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-6 max-h-96 overflow-y-auto pr-1">
                {questions.map((q, qIndex) => (
                  <div key={q.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
                    <h5 className="font-semibold text-slate-900 text-sm mb-3">
                      {qIndex + 1}. {q.question}
                    </h5>

                    <div className="space-y-2">
                      {q.options.map((opt, optIndex) => {
                        const isSelected = selectedAnswers[q.id] === optIndex;
                        return (
                          <label
                            key={optIndex}
                            onClick={() => handleOptionSelect(q.id, optIndex)}
                            className={`flex items-start gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-medium'
                                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              checked={isSelected}
                              onChange={() => handleOptionSelect(q.id, optIndex)}
                              className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !isComplete}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                    isComplete && !submitting
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Evaluating...' : 'Submit Knowledge Check'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
