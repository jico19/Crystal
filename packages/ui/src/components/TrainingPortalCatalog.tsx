'use client';

import React, { useState } from 'react';
import type { TrainingModule, CaregiverTrainingProgress, TrainingComplianceSummary } from '@crystal/types';
import { TrainingModuleCard } from './TrainingModuleCard';

export interface TrainingPortalCatalogProps {
  modules: Array<TrainingModule & { progress?: Partial<CaregiverTrainingProgress> }>;
  complianceSummary?: TrainingComplianceSummary;
  stateCode?: string;
  onSelectModule: (moduleId: string) => void;
  onTakeQuiz: (moduleId: string) => void;
  onViewCertificate?: (certificateHash: string) => void;
}

export const TrainingPortalCatalog: React.FC<TrainingPortalCatalogProps> = ({
  modules,
  complianceSummary,
  stateCode = 'GA',
  onSelectModule,
  onTakeQuiz,
  onViewCertificate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const earnedHours = complianceSummary?.total_earned_hours || 0;
  const requiredHours = complianceSummary?.required_annual_hours || 12;
  const progressPct = Math.min(100, Math.round((earnedHours / requiredHours) * 100));

  const categories = [
    { id: 'all', label: 'All Courses' },
    { id: 'hipaa', label: 'HIPAA & Privacy' },
    { id: 'infection_control', label: 'Infection Control' },
    { id: 'elder_abuse', label: 'Elder Abuse' },
    { id: 'client_rights', label: 'Client Rights' },
  ];

  const filteredModules = modules.filter((mod) => {
    if (selectedCategory !== 'all' && mod.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        mod.title.toLowerCase().includes(q) ||
        mod.description.toLowerCase().includes(q) ||
        mod.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Annual CEU Compliance Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 md:p-8 text-white shadow-lg border border-slate-800">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Annual State Training Tracker • {stateCode === 'GA' ? 'Georgia DCH' : 'Indiana FSSA'} Mandate
          </div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            In-Service Training & Continuing Education
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            All active home care caregivers must fulfill a minimum of 12 Continuing Education Units (CEUs) each calendar year. Complete video lessons and pass end-of-module quizzes to earn verified certificates.
          </p>

          {/* Progress metric bar */}
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/10">
            <div className="flex flex-wrap items-center justify-between text-sm mb-2 gap-2">
              <span className="font-semibold text-slate-200">Annual Hours Progress</span>
              <div className="font-bold">
                <span className="text-emerald-400">{earnedHours} hrs</span>
                <span className="text-slate-400 font-normal"> / {requiredHours} hrs required ({progressPct}%)</span>
              </div>
            </div>
            <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            {progressPct >= 100 && (
              <div className="mt-2.5 text-xs text-emerald-300 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Annual continuing education requirement met for the current period!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Modules Grid */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => (
            <TrainingModuleCard
              key={mod.id}
              module={mod}
              onStartCourse={onSelectModule}
              onTakeQuiz={onTakeQuiz}
              onViewCertificate={onViewCertificate}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-base font-semibold text-slate-800 mb-1">No courses found</h3>
          <p className="text-xs text-slate-500">Try adjusting your search query or selected category filter.</p>
        </div>
      )}
    </div>
  );
};
