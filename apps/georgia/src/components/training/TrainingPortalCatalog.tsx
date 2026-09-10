import React from 'react';
import type { TrainingModule, CaregiverTrainingProgress } from '@crystal/types';
import { Card, CardContent, Button, Badge } from '@crystal/ui';
import { PlayCircle, Award, CheckCircle, Clock } from 'lucide-react';

export interface EnrichedTrainingModule extends TrainingModule {
  progress?: CaregiverTrainingProgress;
}

export interface TrainingPortalCatalogProps {
  modules: EnrichedTrainingModule[];
  onStartModule: (module: EnrichedTrainingModule) => void;
  onViewCertificate: (progressId: string) => void;
}

export const TrainingPortalCatalog: React.FC<TrainingPortalCatalogProps> = ({
  modules,
  onStartModule,
  onViewCertificate,
}) => {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">In-Service Training & CEU Curriculum</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete required compliance courses, pass quizzes with 80%+, and earn state-verifiable certificates
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((m) => {
          const isPassed = !!m.progress?.passed;
          const watchPercentage = m.progress ? Number(m.progress.watch_progress_percentage) : 0;
          const isVideoCompleted = !!m.progress?.video_completed || watchPercentage >= 90;

          return (
            <Card key={m.id} className="flex flex-col justify-between hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant={isPassed ? 'success' : isVideoCompleted ? 'info' : 'neutral'} size="sm">
                    {isPassed ? 'Passed & Certified' : isVideoCompleted ? 'Quiz Unlocked' : 'In Progress'}
                  </Badge>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.round(m.duration_seconds / 60)} mins
                  </span>
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                    {m.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-3">
                    {m.description}
                  </p>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                    <span>Watched</span>
                    <span>{watchPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isPassed ? 'bg-emerald-600' : 'bg-primary-600'
                      }`}
                      style={{ width: `${watchPercentage}%` }}
                    />
                  </div>
                </div>

                {isPassed && m.progress?.highest_score && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between text-xs text-emerald-800">
                    <span className="flex items-center gap-1 font-medium">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Score: {m.progress.highest_score}%
                    </span>
                    <span className="text-[10px] text-emerald-600">
                      Attempts: {m.progress.quiz_attempts}
                    </span>
                  </div>
                )}
              </CardContent>

              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                {isPassed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => m.progress?.id && onViewCertificate(m.progress.id)}
                    leftIcon={<Award className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    View Certificate
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    className="w-full"
                    onClick={() => onStartModule(m)}
                    leftIcon={<PlayCircle className="w-3.5 h-3.5" />}
                  >
                    {watchPercentage > 0 ? 'Continue Lesson' : 'Start Lesson'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
