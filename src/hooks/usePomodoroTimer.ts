import { useState, useEffect, useRef } from 'react';
import type { Task, AppSettings } from '../types';
import { PomodoroEngine } from '../services/PomodoroEngine';

interface UsePomodoroTimerOptions {
  task: Task;
  settings: AppSettings;
  minimized: boolean;
  onSessionFinished: (wasMinimized: boolean, xp: number, durationMinutes: number) => void;
}

export function usePomodoroTimer({ task, settings, minimized, onSessionFinished }: UsePomodoroTimerOptions) {
  const totalMs = settings.pomodoroWorkMinutes * 60 * 1000;
  const [endTime, setEndTime] = useState<number | null>(null);
  const [pausedRemainingMs, setPausedRemainingMs] = useState(totalMs);
  const [remainingMs, setRemainingMs] = useState(totalMs);
  const [isRunning, setIsRunning] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const minimizedRef = useRef(minimized);
  const finishedRef = useRef(false);
  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    minimizedRef.current = minimized;
  }, [minimized]);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  // High-frequency 50ms interval timer effect
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const currentEndTime = endTime ?? now;
      const left = Math.max(0, currentEndTime - now);
      setRemainingMs(left);

      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true;
        setIsRunning(false);
        setIsFinished(true);
        setEndTime(null);
        setPausedRemainingMs(0);
        PomodoroEngine.playCompletionAudio(task.title);
        onSessionFinished(minimizedRef.current, PomodoroEngine.calculateXP(settings.pomodoroWorkMinutes), settings.pomodoroWorkMinutes);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    }, 50);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, endTime, settings.pomodoroWorkMinutes, task.title, onSessionFinished]);

  // Reset/sync when work minutes setting changes
  useEffect(() => {
    if (isRunningRef.current) return;
    const ms = settings.pomodoroWorkMinutes * 60 * 1000;
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(null);
    finishedRef.current = false;
  }, [settings.pomodoroWorkMinutes]);

  const startTimer = () => {
    const ms =
      pausedRemainingMs > 0 && pausedRemainingMs < settings.pomodoroWorkMinutes * 60 * 1000
        ? pausedRemainingMs
        : settings.pomodoroWorkMinutes * 60 * 1000;

    finishedRef.current = false;
    setIsFinished(false);
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(Date.now() + ms);
    setIsRunning(true);
  };

  const startNewSession = () => {
    const ms = settings.pomodoroWorkMinutes * 60 * 1000;
    finishedRef.current = false;
    setIsFinished(false);
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(Date.now() + ms);
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setPausedRemainingMs(remainingMs);
    setEndTime(null);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsFinished(false);
    finishedRef.current = false;
    const ms = settings.pomodoroWorkMinutes * 60 * 1000;
    setPausedRemainingMs(ms);
    setRemainingMs(ms);
    setEndTime(null);
  };

  const progress = PomodoroEngine.calculateProgress(remainingMs, totalMs, isFinished);
  const timeDisplay = PomodoroEngine.formatTimeDisplay(remainingMs);

  return {
    remainingMs,
    totalMs,
    isRunning,
    isFinished,
    progress,
    timeDisplay,
    startTimer,
    startNewSession,
    pauseTimer,
    resetTimer,
    setIsFinished,
  };
}
