import { useMemo, useState } from 'react';
import type { Task, Category, PomodoroSession, ChartType } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, Legend } from 'recharts';

interface Props {
  tasks: Task[];
  pomodoroHistory: PomodoroSession[];
  categories: Category[];
}

const CHART_COLORS = ['#ffffff', '#f0f0fa', '#a0a0ff', '#5aaa6f', '#ffb7c5', '#ffd700', '#87ceeb', '#ff9eb5'];

export default function Analytics({ tasks, pomodoroHistory, categories }: Props) {
  const [activeChart, setActiveChart] = useState(0);

  // Data: daily completions (last 30 days)
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; tasks: number; pomodoro: number; xp: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }), tasks: 0, pomodoro: 0, xp: 0 };
    }
    tasks.filter(t => t.completed && t.completedDate).forEach(t => {
      const key = t.completedDate!.slice(0, 10);
      if (map[key]) { map[key].tasks++; map[key].xp += t.xp; }
    });
    pomodoroHistory.forEach(p => {
      const key = p.completedAt.slice(0, 10);
      if (map[key]) { map[key].pomodoro++; map[key].xp += p.xpEarned; }
    });
    return Object.values(map);
  }, [tasks, pomodoroHistory]);

  // Data: category distribution
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; value: number; xp: number }> = {};
    categories.forEach(c => { map[c.id] = { name: c.name, emoji: c.emoji, value: 0, xp: 0 }; });
    tasks.filter(t => t.completed).forEach(t => {
      if (map[t.categoryId]) { map[t.categoryId].value++; map[t.categoryId].xp += t.xp; }
    });
    return Object.values(map).filter(d => d.value > 0);
  }, [tasks, categories]);

  // Data: last 7/30 days bar
  const barData = useMemo(() => {
    const last7 = dailyData.slice(-7);
    const last30 = dailyData;
    return { last7, last30 };
  }, [dailyData]);

  const [barRange, setBarRange] = useState<'7' | '30'>('7');
  const [chartType, setChartType] = useState<ChartType>('bar');

  const renderChart = (data: typeof dailyData, dataKey: string, color: string) => {
    const ChartComponent = chartType === 'line' ? LineChart : chartType === 'area' ? AreaChart : chartType === 'dot' ? ScatterChart : BarChart;
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ChartComponent data={data}>
          <CartesianGrid stroke="var(--hairline)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
          <YAxis stroke="var(--text-muted)" tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--hairline)', borderRadius: '4px', color: 'var(--text-primary)' }}
            labelStyle={{ color: 'var(--text-soft)', fontWeight: 700, textTransform: 'uppercase', fontSize: '11px' }}
          />
          <Legend />
          {chartType === 'line' && <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : 'Помодоро'} />}
          {chartType === 'bar' && <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : 'Помодоро'} />}
          {chartType === 'area' && <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : 'Помодоро'} />}
          {chartType === 'dot' && <Scatter dataKey={dataKey} fill={color} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : 'Помодоро'} />}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  const charts = [
    { title: 'ВЫПОЛНЕНИЕ ЗАДАЧ ПО ДНЯМ', data: dailyData, key: 'tasks', color: 'var(--text-primary)' },
    { title: 'XP ПО ДНЯМ', data: dailyData, key: 'xp', color: '#5aaa6f' },
    { title: `ПОМОДОРО-СЕССИИ (${barRange} ДНЕЙ)`, data: barRange === '7' ? barData.last7 : barData.last30, key: 'pomodoro', color: '#ffb7c5' },
  ];

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>АНАЛИТИКА</h2>

      {/* Chart type toggle */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="micro-cap" style={{ fontSize: '10px', marginRight: '8px' }}>ТИП ГРАФИКА:</span>
        {(['bar','line','area','dot'] as ChartType[]).map(t => (
          <button key={t} className={`btn-ghost btn-ghost-xs ${chartType === t ? '' : ''}`}
            style={{ background: chartType === t ? 'var(--ghost-hover)' : 'transparent' }}
            onClick={() => setChartType(t)}>
            {t === 'bar' ? 'СТОЛБЦЫ' : t === 'line' ? 'ЛИНИИ' : t === 'area' ? 'ОБЛАСТЬ' : 'ТОЧКИ'}
          </button>
        ))}
        <span className="micro-cap" style={{ fontSize: '10px', marginLeft: '16px', marginRight: '8px' }}>ПЕРИОД:</span>
        <button className={`btn-ghost btn-ghost-xs ${barRange === '7' ? '' : ''}`}
          style={{ background: barRange === '7' ? 'var(--ghost-hover)' : 'transparent' }}
          onClick={() => setBarRange('7')}>7 ДНЕЙ</button>
        <button className={`btn-ghost btn-ghost-xs ${barRange === '30' ? '' : ''}`}
          style={{ background: barRange === '30' ? 'var(--ghost-hover)' : 'transparent' }}
          onClick={() => setBarRange('30')}>30 ДНЕЙ</button>
      </div>

      {/* Chart selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {charts.map((c, i) => (
          <button key={i} className={`tab-btn ${activeChart === i ? 'active' : ''}`} onClick={() => setActiveChart(i)}>
            {c.title}
          </button>
        ))}
      </div>

      {/* Active chart */}
      <div className="chart-container" style={{ marginBottom: '24px' }}>
        <h3 className="micro-cap" style={{ marginBottom: '20px' }}>{charts[activeChart].title}</h3>
        {renderChart(charts[activeChart].data, charts[activeChart].key, charts[activeChart].color)}
      </div>

      {/* Pie chart - category distribution */}
      <div className="chart-container">
        <h3 className="micro-cap" style={{ marginBottom: '20px' }}>РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ</h3>
        {categoryData.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Нет данных для отображения</p>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, value, payload }: { name?: string; value?: number; payload?: Record<string, unknown> }) => `${(payload as Record<string, string>).emoji || ''} ${name || ''} (${value || 0})`}>
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="#000000" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--hairline)', borderRadius: '4px', color: 'var(--text-primary)' }}
                formatter={(_value, _name, props) => {
                  const p = props?.payload as Record<string, unknown> | undefined;
                  return [`${_value} задач (+${p?.xp || 0} XP)`, `${p?.emoji || ''} ${_name}`];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
}
