import type { PomodoroSession } from '../../types';
import Modal from './Modal';

interface Props {
  title?: string;
  sessions: PomodoroSession[];
  onClose: () => void;
}

export default function PomodoroHistoryModal({ title, sessions, onClose }: Props) {
  const totalMinutes = sessions.reduce((s, p) => s + (p.duration || 25), 0);
  const totalXP = sessions.reduce((s, p) => s + p.xpEarned, 0);

  return (
    <Modal onClose={onClose} overlayStyle={{ zIndex: 10005 }} contentStyle={{ maxWidth: '460px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>
          ⏰ ИСТОРИЯ ПОМОДОРО
        </h3>
        <button className="btn-ghost btn-ghost-xs" onClick={onClose}>✕</button>
      </div>

      {title && (
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Задача: «{title}»
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', fontSize: '12px', color: 'var(--text-soft)', flexWrap: 'wrap' }}>
        <span>🍅 Сессий: <strong>{sessions.length}</strong></span>
        <span>⏱ Общее время: <strong>{totalMinutes} мин</strong></span>
        <span style={{ color: '#5aaa6f' }}>⚡ Всего XP: <strong>+{totalXP} XP</strong></span>
      </div>

      {sessions.length === 0 ? (
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
          Для этой задачи ещё нет завершённых фокус-сессий.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto' }}>
          {sessions.map((s, idx) => (
            <div key={s.id || idx} style={{ padding: '10px 14px', background: 'var(--surface-hover)', borderRadius: '8px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                <span>🍅 Сессия #{idx + 1} {!title ? `(«${s.taskTitle}»)` : ''}</span>
                <span style={{ color: '#60a5fa' }}>⏱ {s.duration || 25} мин</span>
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-soft)', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                <span>📅 {new Date(s.completedAt).toLocaleString('ru', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                <span style={{ color: '#5aaa6f', fontWeight: 600 }}>⚡ +{s.xpEarned} XP</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button className="btn-ghost btn-ghost-sm" style={{ marginTop: '16px', width: '100%' }} onClick={onClose}>
        ЗАКРЫТЬ
      </button>
    </Modal>
  );
}
