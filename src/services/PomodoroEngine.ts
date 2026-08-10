import { SoundSynthesizer } from './SoundSynthesizer';

export class PomodoroEngine {
  public static calculateProgress(remainingMs: number, totalMs: number, isFinished: boolean): number {
    if (isFinished) return 1;
    if (totalMs <= 0) return 0;
    return Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
  }

  public static formatTimeDisplay(remainingMs: number): string {
    const displaySec = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(displaySec / 60);
    const seconds = displaySec % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  public static playCompletionAudio(taskTitle: string): void {
    const synth = SoundSynthesizer.getInstance();
    synth.playChime();
    synth.announceText(`Сессия по задаче ${taskTitle} завершена`);
  }
}
