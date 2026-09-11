import React, { useRef, useState, useEffect } from 'react';
import type { TrainingModule } from '@crystal/types';
import { Button } from './Button.js';
import { Play, Pause, RotateCcw, CheckCircle, HelpCircle } from 'lucide-react';

export interface VideoPlayerWithProgressProps {
  module: TrainingModule;
  initialWatchSeconds?: number;
  onProgressUpdate: (watchedSeconds: number, deltaSeconds: number) => Promise<void>;
  onUnlockQuiz: () => void;
}

export const VideoPlayerWithProgress: React.FC<VideoPlayerWithProgressProps> = ({
  module,
  initialWatchSeconds = 0,
  onProgressUpdate,
  onUnlockQuiz,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialWatchSeconds);
  const [furthestWatched, setFurthestWatched] = useState(initialWatchSeconds);
  const [duration, setDuration] = useState(module.duration_seconds || 300);
  const [isQuizUnlocked, setIsQuizUnlocked] = useState(false);
  const lastReportedTimeRef = useRef(initialWatchSeconds);

  // Set initial position
  useEffect(() => {
    if (videoRef.current && initialWatchSeconds > 0) {
      videoRef.current.currentTime = initialWatchSeconds;
    }
  }, [initialWatchSeconds]);

  // Anti-skip seek barrier
  const handleSeeking = () => {
    if (videoRef.current) {
      if (videoRef.current.currentTime > furthestWatched + 1) {
        // Enforce anti-skip rule: snap back to furthest watched position
        videoRef.current.currentTime = furthestWatched;
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const now = videoRef.current.currentTime;
    setCurrentTime(now);

    if (now > furthestWatched) {
      setFurthestWatched(now);
    }

    // Check 90% threshold for quiz unlock
    const currentDur = videoRef.current.duration || duration;
    if (currentDur > 0 && (now / currentDur) >= 0.9 && !isQuizUnlocked) {
      setIsQuizUnlocked(true);
      onUnlockQuiz();
    }

    // Report progress to backend every 10 seconds
    const delta = now - lastReportedTimeRef.current;
    if (delta >= 10) {
      lastReportedTimeRef.current = now;
      onProgressUpdate(now, delta).catch((err) =>
        console.warn('Progress sync error:', err)
      );
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const percentWatched = Math.min(100, Math.round((furthestWatched / (duration || 1)) * 100));

  return (
    <div className="w-full bg-slate-900 rounded-2xl overflow-hidden shadow-xl text-white">
      {/* Video Container */}
      <div className="relative aspect-video bg-black flex items-center justify-center">
        <video
          ref={videoRef}
          src={module.video_url}
          className="w-full h-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onSeeking={handleSeeking}
          onLoadedMetadata={() => {
            if (videoRef.current?.duration) {
              setDuration(videoRef.current.duration);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setIsQuizUnlocked(true);
            onUnlockQuiz();
          }}
        />

        {/* Big play overlay if paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-primary-600/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
          >
            <Play className="w-8 h-8 ml-1 fill-white" />
          </button>
        )}
      </div>

      {/* Controls Bar */}
      <div className="p-4 bg-slate-800/90 space-y-3">
        {/* Anti-skip progress rail */}
        <div className="space-y-1">
          <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden relative">
            {/* Furthest watched boundary */}
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${percentWatched}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>
              {Math.floor(currentTime / 60)}:
              {String(Math.floor(currentTime % 60)).padStart(2, '0')} /{' '}
              {Math.floor(duration / 60)}:
              {String(Math.floor(duration % 60)).padStart(2, '0')}
            </span>
            <span>{percentWatched}% completed (Anti-Skip Protected)</span>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={togglePlay}
              leftIcon={isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            >
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestart}
              className="text-slate-300 hover:text-white"
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Restart
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {isQuizUnlocked ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onUnlockQuiz}
                leftIcon={<CheckCircle className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
              >
                Take Knowledge Check Quiz
              </Button>
            ) : (
              <span className="text-xs text-amber-400 flex items-center gap-1.5 font-medium">
                <HelpCircle className="w-3.5 h-3.5" />
                Watch 90% to unlock quiz ({percentWatched}/90%)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
