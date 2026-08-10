import { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/StorageService';
import { XPService } from '../services/XPService';

function getStoredLevel(): number {
  const data = StorageService.loadAppData();
  const totalXP = XPService.calculateTotalXP(data);
  return XPService.getLevelInfo(totalXP).level;
}

export function useLevelUp(currentLevel: number) {
  const [levelUpToast, setLevelUpToast] = useState<{ level: number; stage: number } | null>(null);
  const [toastProgress, setToastProgress] = useState(100);
  const prevLevelRef = useRef(getStoredLevel());
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastProgressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (currentLevel > prevLevelRef.current && prevLevelRef.current > 0) {
      const stage = XPService.getTreeStage(currentLevel);
      setLevelUpToast({ level: currentLevel, stage });
      setToastProgress(100);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastProgressRef.current) clearInterval(toastProgressRef.current);
      toastTimerRef.current = setTimeout(() => setLevelUpToast(null), 10000);
      const startTime = Date.now();
      toastProgressRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.max(0, 100 - (elapsed / 10000) * 100);
        setToastProgress(pct);
        if (pct <= 0) {
          if (toastProgressRef.current) clearInterval(toastProgressRef.current);
        }
      }, 80);
    }
    prevLevelRef.current = currentLevel;
  }, [currentLevel]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      if (toastProgressRef.current) clearInterval(toastProgressRef.current);
    };
  }, []);

  return {
    levelUpToast,
    toastProgress,
    dismissLevelUpToast: () => setLevelUpToast(null),
  };
}
