import React from 'react';
import type { ChartType } from '../../types';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface AnalyticsChartsProps {
  data: Record<string, string | number>[];
  dataKey: string;
  color: string;
  chartType: ChartType;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  data,
  dataKey,
  color,
  chartType,
}) => {
  const getSeriesName = (key: string) => {
    switch (key) {
      case 'tasks': return 'Задачи';
      case 'xp': return 'XP';
      case 'pomodoro': return 'Помодоро';
      case 'workouts': return 'Тренировки';
      case 'workoutXP': return 'XP тренировок';
      default: return 'Длительность';
    }
  };

  const name = getSeriesName(dataKey);

  const renderContent = () => {
    switch (chartType) {
      case 'line':
        return <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} name={name} />;
      case 'area':
        return <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} name={name} />;
      case 'dot':
        return <Scatter dataKey={dataKey} fill={color} name={name} />;
      case 'bar':
      default:
        return <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} name={name} />;
    }
  };

  const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : chartType === 'dot' ? ScatterChart : BarChart;

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ChartComponent data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
        <XAxis dataKey="date" stroke="var(--text-soft)" tick={{ fontSize: 11 }} />
        <YAxis stroke="var(--text-soft)" tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ background: 'var(--card-bg)', border: '1px solid var(--border-soft)', borderRadius: '12px', color: 'var(--text-primary)' }}
          labelStyle={{ color: 'var(--text-soft)', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}
        />
        <Legend />
        {renderContent()}
      </ChartComponent>
    </ResponsiveContainer>
  );
};
