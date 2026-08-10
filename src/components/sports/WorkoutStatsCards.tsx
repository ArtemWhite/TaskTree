import React from 'react';
import type { WorkoutStats } from '../../types';

interface WorkoutStatsCardsProps {
  stats: WorkoutStats;
}

export const WorkoutStatsCards: React.FC<WorkoutStatsCardsProps> = ({ stats }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="micro-cap" style={{ color: 'var(--text-soft)' }}>ВСЕГО ТРЕНИРОВОК</span>
        <span style={{ fontSize: '28px', fontWeight: 800 }}>
          {stats.completed} <span style={{ fontSize: '14px', color: 'var(--text-soft)', fontWeight: 400 }}>из {stats.total}</span>
        </span>
      </div>
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="micro-cap" style={{ color: 'var(--text-soft)' }}>ОБЩЕЕ ВРЕМЯ</span>
        <span style={{ fontSize: '28px', fontWeight: 800 }}>
          {stats.totalDuration} <span style={{ fontSize: '14px', color: 'var(--text-soft)', fontWeight: 400 }}>мин</span>
        </span>
      </div>
      <div className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <span className="micro-cap" style={{ color: 'var(--text-soft)' }}>ЗАРАБОТАНО XP</span>
        <span style={{ fontSize: '28px', fontWeight: 800, color: '#5aaa6f' }}>+{stats.totalXP}</span>
      </div>
    </div>
  );
};
