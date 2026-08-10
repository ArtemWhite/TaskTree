import type { AppData } from '../../types';
import DataIO from '../DataIO';

interface Props {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  data: AppData;
  onImport: (json: string) => boolean;
}

export default function Navbar({
  level,
  currentXP,
  nextLevelXP,
  totalXP,
  activeTab,
  onTabChange,
  theme,
  onThemeToggle,
  data,
  onImport
}: Props) {
  const tabs = ['tasks', 'sports', 'books', 'progress', 'calendar', 'analytics', 'tables'] as const;
  const getTabLabel = (tab: typeof tabs[number]) => {
    switch (tab) {
      case 'tasks': return 'ЗАДАЧИ';
      case 'sports': return 'СПОРТ';
      case 'books': return 'КНИГИ';
      case 'progress': return 'ПРОГРЕСС';
      case 'calendar': return 'КАЛЕНДАРЬ';
      case 'analytics': return 'АНАЛИТИКА';
      case 'tables': return 'ТАБЛИЦЫ';
    }
  };

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50, background: 'var(--nav-bg)',
      backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--hairline)',
      padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: '12px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontSize: '20px', fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase' }}>
          🌱 TaskTracker
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="micro-cap" style={{ fontSize: '12px', letterSpacing: '0.96px', textTransform: 'uppercase' }}>
            LVL {level}
          </span>
          <div className="progress-bar" style={{ width: '140px' }}>
            <div className="progress-bar-fill" style={{ width: `${(currentXP / nextLevelXP) * 100}%` }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>{totalXP} XP</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          {tabs.map(tab => (
            <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => onTabChange(tab)}>
              {getTabLabel(tab)}
            </button>
          ))}
        </div>
        <button
          className="theme-toggle-btn"
          onClick={onThemeToggle}
          title={theme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <DataIO data={data} onImport={onImport} />
      </div>
    </nav>
  );
}
