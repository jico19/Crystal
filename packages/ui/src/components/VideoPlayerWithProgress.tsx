'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { TrainingModule } from '@crystal/types';

export interface VideoPlayerWithProgressProps {
  module: TrainingModule;
  caregiverId: string;
  initialWatchSeconds?: number;
  onProgressUpdate: (seconds: number, totalDuration: number) => void;
  onTakeQuiz: () => void;
}

export const VideoPlayerWithProgress: React.FC<VideoPlayerWithProgressProps> = ({
  module,
  caregiverId,
  initialWatchSeconds = 0,
  onProgressUpdate,
  onTakeQuiz,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialWatchSeconds);
  const [maxWatchedTime, setMaxWatchedTime] = useState(initialWatchSeconds);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const totalDuration = module.video_duration_seconds;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Playback timer ticker
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          const next = Math.min(totalDuration, prev + 1 * playbackSpeed);
          setMaxWatchedTime((m) => Math.max(m, next));
          return next;
        });
      }, 1000 / playbackSpeed);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, playbackSpeed, totalDuration]);

  // Periodic heartbeat sync to backend every 5 seconds or upon pause
  useEffect(() => {
    onProgressUpdate(maxWatchedTime, totalDuration);
  }, [Math.floor(maxWatchedTime / 5), isPlaying]);

  const watchPercentage = Math.min(100, Math.round((maxWatchedTime / totalDuration) * 100));
  const isQuizUnlocked = watchPercentage >= 90;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = Number(e.target.value);
    // Anti-skipping guardrail: Caregivers cannot jump forward past what they've already watched
    if (target <= maxWatchedTime) {
      setCurrentTime(target);
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800 text-white">
      {/* Video Screen Container */}
      <div className="relative aspect-video bg-black flex flex-col items-center justify-center p-6 select-none overflow-hidden">
        {/* Subtle Animated Background Wave/Mesh */}
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 opacity-90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Center Overlay: Title & State Mandate Badge */}
        <div className="relative z-10 text-center max-w-xl px-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Mandatory Continuing Education • {module.state_code === 'ALL' ? 'Georgia & Indiana' : module.state_code}
          </div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mb-2">
            {module.title}
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
            {module.description}
          </p>
        </div>

        {/* Big Center Play / Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause Video' : 'Play Video'}
          className="relative z-10 mt-6 w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all focus:outline-none focus:ring-4 focus:ring-indigo-400/30"
        >
          {isPlaying ? (
            <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75zm10.5 0a.75.75 0 01.75.75v12a.75.75 0 01-1.5 0v-12a.75.75 0 01.75-.75z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-7 h-7 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* Anti-skipping notice */}
        <div className="absolute top-4 right-4 z-10 bg-slate-800/80 backdrop-blur text-xs px-2.5 py-1 rounded-md text-slate-300 border border-slate-700 flex items-center gap-1.5">
          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>Anti-skipping active</span>
        </div>
      </div>

      {/* Media Controls Bar */}
      <div className="p-4 bg-slate-900 border-t border-slate-800">
        {/* Scrubber track */}
        <div className="relative mb-3">
          <input
            type="range"
            min={0}
            max={totalDuration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          {/* Max watched indicator overlay */}
          <div
            className="absolute top-0 left-0 h-1.5 bg-indigo-500/40 rounded-lg pointer-events-none"
            style={{ width: `${(maxWatchedTime / totalDuration) * 100}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.75 3a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 007.25 3h-1.5zm7 0a.75.75 0 00-.75.75v12.5c0 .414.336.75.75.75h1.5a.75.75 0 00.75-.75V3.75A.75.75 0 0014.25 3h-1.5z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                </svg>
              )}
            </button>

            {/* Time display */}
            <span className="text-xs font-mono text-slate-300">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>

            {/* Speed Toggle */}
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-0.5 text-xs">
              {[1, 1.25, 1.5].map((speed) => (
                <button
                  key={speed}
                  onClick={() => setPlaybackSpeed(speed)}
                  className={`px-2 py-0.5 rounded ${
                    playbackSpeed === speed
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Right Action: Quiz Unlock Status & Button */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xs text-slate-400">Watch Requirement: &ge; 90%</div>
              <div className="text-xs font-semibold text-indigo-400">
                Current: {watchPercentage}%
              </div>
            </div>

            <button
              onClick={onTakeQuiz}
              disabled={!isQuizUnlocked}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                isQuizUnlocked
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isQuizUnlocked ? 'Take Knowledge Check' : 'Quiz Locked'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
