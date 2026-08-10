export function formatXP(xp: number): string {
  return `+${xp} XP`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs} ч ${mins} мин` : `${hrs} ч`;
}
