import { useEffect, useRef, useState } from 'react';

export function useAnimatedPieData<T extends { name: string; value: number; duration: number }>(
  targetData: T[],
  mode: 'count' | 'duration',
  durationMs: number = 350
) {
  const [animatedData, setAnimatedData] = useState<Array<T & { currentValue: number }>>(() =>
    targetData.map(d => ({ ...d, currentValue: mode === 'count' ? d.value : d.duration }))
  );

  const animRef = useRef<number | null>(null);
  const currentValuesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    animatedData.forEach(d => {
      currentValuesRef.current[d.name] = d.currentValue;
    });
  });

  useEffect(() => {
    if (targetData.length === 0) return;

    const startValues: Record<string, number> = {};
    targetData.forEach(d => {
      startValues[d.name] = currentValuesRef.current[d.name] ?? (mode === 'count' ? d.duration : d.value);
    });

    const targetValues: Record<string, number> = {};
    targetData.forEach(d => {
      targetValues[d.name] = mode === 'count' ? d.value : d.duration;
    });

    const startTime = performance.now();

    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
    }

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      const nextData = targetData.map(d => {
        const start = startValues[d.name] ?? 0;
        const target = targetValues[d.name] ?? 0;
        const currentVal = start + (target - start) * ease;
        return {
          ...d,
          currentValue: currentVal
        };
      });

      setAnimatedData(nextData);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [targetData, mode, durationMs]);

  return animatedData;
}
