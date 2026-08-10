import { STAGE_NAMES } from '../ProgressSection';

interface Props {
  levelUpToast: { level: number; stage: number } | null;
  toastProgress: number;
  onDismissLevelUp: () => void;
  pomodoroCompleteToast: { taskId: string; taskTitle: string; xp: number } | null;
  onPomodoroToastClick: () => void;
  onDismissPomodoroToast: () => void;
}

export default function ToastContainer({
  levelUpToast,
  toastProgress,
  onDismissLevelUp,
  pomodoroCompleteToast,
  onPomodoroToastClick,
  onDismissPomodoroToast
}: Props) {
  return (
    <>
      {levelUpToast && (
        <div style={{
          position: 'fixed', bottom: '32px', right: '32px', zIndex: 200,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-soft)',
          borderRadius: '16px', padding: '20px 24px', maxWidth: '360px',
          boxShadow: '0 12px 40px rgba(0,0,0,0.6)', overflow: 'hidden',
          animation: 'grow 0.4s ease-out'
        }}>
          <div style={{ position: 'absolute', bottom: 0, left: 0, height: '3px', background: 'linear-gradient(90deg, #5aaa6f, #ffd700)', width: `${toastProgress}%`, transition: 'width 0.08s linear' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px' }}>🎉</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '16px', color: '#ffd700' }}>НОВЫЙ УРОВЕНЬ!</div>
              <div style={{ fontSize: '14px', marginTop: '2px' }}>Вы достигли <strong>Уровня {levelUpToast.level}</strong></div>
              <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '2px' }}>Дерево: {STAGE_NAMES[levelUpToast.stage] || 'Выросло!'}</div>
            </div>
            <button className="btn-ghost btn-ghost-xs" style={{ marginLeft: 'auto', outline: 'none' }} onClick={onDismissLevelUp}>✕</button>
          </div>
        </div>
      )}

      {pomodoroCompleteToast && (
        <div
          style={{
            position: 'fixed', bottom: levelUpToast ? '140px' : '32px', right: '32px', zIndex: 200,
            background: 'var(--bg-secondary)', border: '1px solid #5aaa6f',
            borderRadius: '16px', padding: '20px 24px', maxWidth: '380px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.6)', cursor: 'pointer',
            animation: 'grow 0.4s ease-out'
          }}
          onClick={onPomodoroToastClick}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '36px' }}>🍅</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '15px', color: '#5aaa6f' }}>ПОМОДОРО ЗАВЕРШЁН!</div>
              <div style={{ fontSize: '13px', marginTop: '2px' }}>{pomodoroCompleteToast.taskTitle}</div>
              <div style={{ fontSize: '12px', color: '#5aaa6f', marginTop: '2px', fontWeight: 600 }}>+{pomodoroCompleteToast.xp} XP получено!</div>
            </div>
            <button className="btn-ghost btn-ghost-xs" style={{ marginLeft: 'auto', outline: 'none' }} onClick={(e) => { e.stopPropagation(); onDismissPomodoroToast(); }}>✕</button>
          </div>
        </div>
      )}
    </>
  );
}
