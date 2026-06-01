import { useState } from 'react';
import type { Task } from '../types';

interface Props { tasks: Task[]; onActivate: () => void; }

export default function RandomTask({ tasks, onActivate }: Props) {
  const [rolledTask, setRolledTask] = useState<Task | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleRoll = () => {
    if (tasks.length === 0) return;
    const idx = Math.floor(Math.random() * tasks.length);
    setRolledTask(tasks[idx]);
    setShowResult(true);
  };

  return (
    <>
      <button className="btn-ghost" onClick={handleRoll} style={{ opacity: tasks.length === 0 ? 0.5 : 1 }}>
        🎲 СЛУЧАЙНАЯ ЗАДАЧА
      </button>

      {showResult && (
        <div className="modal-overlay" onClick={() => setShowResult(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 className="micro-cap" style={{ marginBottom: '24px' }}>🎲 СЛУЧАЙНАЯ ЗАДАЧА ДНЯ</h3>

            {rolledTask ? (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                  {rolledTask.difficulty === 'easy' ? '🟢' : rolledTask.difficulty === 'medium' ? '🟡' : '🔴'}
                </div>
                <p style={{ fontSize: '20px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                  {rolledTask.title}
                </p>
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
                  <span className="badge">
                    {rolledTask.difficulty === 'easy' ? 'ЛЁГКАЯ' : rolledTask.difficulty === 'medium' ? 'СРЕДНЯЯ' : 'СЛОЖНАЯ'}
                  </span>
                  <span className="badge">+{rolledTask.xp} XP</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn-ghost btn-ghost-sm" onClick={() => { setShowResult(false); onActivate(); }}>
                    К ЗАДАЧАМ
                  </button>
                  <button className="btn-ghost btn-ghost-sm" onClick={handleRoll}>
                    🎲 ЕЩЁ РАЗ
                  </button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '18px', color: 'var(--text-soft)', marginBottom: '24px' }}>
                  Все задачи выполнены! Добавь новые, чтобы продолжить.
                </p>
                <button className="btn-ghost btn-ghost-sm" onClick={() => { setShowResult(false); onActivate(); }}>
                  ДОБАВИТЬ ЗАДАЧИ
                </button>
              </>
            )}

            <button className="btn-ghost btn-ghost-xs" style={{ marginTop: '20px' }} onClick={() => setShowResult(false)}>
              ЗАКРЫТЬ
            </button>
          </div>
        </div>
      )}
    </>
  );
}
