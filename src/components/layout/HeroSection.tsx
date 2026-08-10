import type { Task } from '../../types';
import RandomTask from '../RandomTask';

interface Props {
  activeTasks: Task[];
  onNavigateTab: (tab: string) => void;
}

export default function HeroSection({ activeTasks, onNavigateTab }: Props) {
  return (
    <section style={{ textAlign: 'center', padding: '64px 24px 48px', borderBottom: '1px solid var(--hairline)', position: 'relative', overflow: 'hidden' }}>
      <div className="starfield" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} />
      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <p className="micro-cap" style={{ marginBottom: '16px' }}>ТРЕКЕР ЗАДАЧ И ПРИВЫЧЕК</p>
        <h1 className="section-heading" style={{ marginBottom: '16px' }}>ПЛАНИРУЙ И ОТСЛЕЖИВАЙ<br />СВОИ РЕЗУЛЬТАТЫ</h1>
        <p style={{ color: 'var(--text-soft)', fontSize: '16px', letterSpacing: '0.32px', maxWidth: '600px', margin: '0 auto 32px' }}>
          Задачи, спорт и помодоро-таймер в одном месте. Выполняй цели, зарабатывай опыт и следи за прогрессом.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-ghost" onClick={() => onNavigateTab('tasks')}>ДОБАВИТЬ ЗАДАЧУ</button>
          <RandomTask tasks={activeTasks} onActivate={() => onNavigateTab('tasks')} />
          <button className="btn-ghost" onClick={() => onNavigateTab('sports')}>🏋️ СПОРТ</button>
        </div>
      </div>
    </section>
  );
}
