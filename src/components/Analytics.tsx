import { useMemo, useState } from 'react';
import type { Task, Category, PomodoroSession, ChartType, Workout } from '../types';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, Legend } from 'recharts';

interface Props {
  tasks: Task[];
  pomodoroHistory: PomodoroSession[];
  categories: Category[];
  workouts: Workout[];
}

interface WorkoutTypeDef {
  icon: string;
  name: string;
  color: string;
}

const BUILT_IN_WORKOUT_TYPES: WorkoutTypeDef[] = [
  { icon: '🏃', name: 'Бег', color: '#ff6b6b' },
  { icon: '🏋️', name: 'Силовая', color: '#ff9f43' },
  { icon: '🏊', name: 'Плавание', color: '#54a0ff' },
  { icon: '🚴', name: 'Вело', color: '#5f27cd' },
  { icon: '🧘', name: 'Растяжка', color: '#a29bfe' },
  { icon: '🥊', name: 'Единоборства', color: '#e056a0' },
  { icon: '🎾', name: 'Игровые', color: '#ffd700' },
  { icon: '🏔️', name: 'Поход', color: '#00b894' },
  { icon: '💪', name: 'Фитнес', color: '#e17055' },
  { icon: '⚽', name: 'Футбол', color: '#74b9ff' },
  { icon: '🏀', name: 'Баскетбол', color: '#fd9644' },
  { icon: '📋', name: 'Другое', color: '#b2bec3' },
];

const CHART_COLORS = ['#ffffff', '#f0f0fa', '#a0a0ff', '#5aaa6f', '#ffb7c5', '#ffd700', '#87ceeb', '#ff9eb5'];
const CUSTOM_TYPES_KEY = 'tasktrecker-custom-workout-types';

function loadCustomTypes(): WorkoutTypeDef[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TYPES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        return (parsed as string[]).map((name: string) => ({ icon: '⭐', name, color: '#3b82c4' }));
      }
      return parsed;
    }
  } catch {}
  return [];
}

export default function Analytics({ tasks, pomodoroHistory, categories, workouts }: Props) {
  const [activeChart, setActiveChart] = useState(0);
  const [analyticsTab, setAnalyticsTab] = useState<'tasks' | 'sport'>('tasks');
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [activeSportPieIndex, setActiveSportPieIndex] = useState<number | null>(null);
  const savedCustomTypes = useMemo(() => loadCustomTypes(), []);

  const allWorkoutTypeDefs = useMemo(() => {
    const custom = savedCustomTypes.filter(t => !BUILT_IN_WORKOUT_TYPES.some(wt => wt.name === t.name));
    return [...BUILT_IN_WORKOUT_TYPES, ...custom];
  }, [savedCustomTypes]);

  const getTypeColor = (name: string) => allWorkoutTypeDefs.find(t => t.name === name)?.color || '#b2bec3';
  const getTypeIcon = (name: string) => allWorkoutTypeDefs.find(t => t.name === name)?.icon || '📋';

  // Data: daily completions (last 30 days)
  const dailyData = useMemo(() => {
    const map: Record<string, { date: string; tasks: number; pomodoro: number; xp: number; workouts: number; workoutXP: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }), tasks: 0, pomodoro: 0, xp: 0, workouts: 0, workoutXP: 0 };
    }
    tasks.filter(t => t.completed && t.completedDate).forEach(t => {
      const key = t.completedDate!.slice(0, 10);
      if (map[key]) { map[key].tasks++; map[key].xp += t.xp; }
    });
    pomodoroHistory.forEach(p => {
      const key = p.completedAt.slice(0, 10);
      if (map[key]) { map[key].pomodoro++; map[key].xp += p.xpEarned; }
    });
    workouts.filter(w => w.completed).forEach(w => {
      const key = w.date;
      if (map[key]) { map[key].workouts++; map[key].workoutXP += w.xp; map[key].xp += w.xp; }
    });
    return Object.values(map);
  }, [tasks, pomodoroHistory, workouts]);

  // Data: category distribution
  const categoryData = useMemo(() => {
    const map: Record<string, { name: string; emoji: string; color: string; value: number; xp: number }> = {};
    categories.forEach(c => { map[c.id] = { name: c.name, emoji: c.emoji, color: c.color, value: 0, xp: 0 }; });
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderChart = (data: Record<string, any>[], dataKey: string, color: string) => {
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
          {chartType === 'line' && <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} dot={{ r: 3 }} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : dataKey === 'pomodoro' ? 'Помодоро' : dataKey === 'workouts' ? 'Тренировки' : dataKey === 'workoutXP' ? 'XP тренировок' : 'Длительность'} />}
          {chartType === 'bar' && <Bar dataKey={dataKey} fill={color} radius={[2, 2, 0, 0]} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : dataKey === 'pomodoro' ? 'Помодоро' : dataKey === 'workouts' ? 'Тренировки' : dataKey === 'workoutXP' ? 'XP тренировок' : 'Длительность'} />}
          {chartType === 'area' && <Area type="monotone" dataKey={dataKey} stroke={color} fill={color} fillOpacity={0.15} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : dataKey === 'pomodoro' ? 'Помодоро' : dataKey === 'workouts' ? 'Тренировки' : dataKey === 'workoutXP' ? 'XP тренировок' : 'Длительность'} />}
          {chartType === 'dot' && <Scatter dataKey={dataKey} fill={color} name={dataKey === 'tasks' ? 'Задачи' : dataKey === 'xp' ? 'XP' : dataKey === 'pomodoro' ? 'Помодоро' : dataKey === 'workouts' ? 'Тренировки' : dataKey === 'workoutXP' ? 'XP тренировок' : 'Длительность'} />}
        </ChartComponent>
      </ResponsiveContainer>
    );
  };

  // Data: workout type distribution
  const workoutTypeData = useMemo(() => {
    const map: Record<string, { name: string; value: number; xp: number; duration: number; color: string; icon: string }> = {};
    workouts.filter(w => w.completed).forEach(w => {
      if (!map[w.workoutType]) {
        map[w.workoutType] = { name: w.workoutType, value: 0, xp: 0, duration: 0, color: getTypeColor(w.workoutType), icon: getTypeIcon(w.workoutType) };
      }
      map[w.workoutType].value++;
      map[w.workoutType].xp += w.xp;
      map[w.workoutType].duration += w.duration;
    });
    return Object.values(map).filter(d => d.value > 0);
  }, [workouts, allWorkoutTypeDefs]);

  const charts = [
    { title: 'ВЫПОЛНЕНИЕ ЗАДАЧ ПО ДНЯМ', data: dailyData, key: 'tasks', color: 'var(--text-primary)' },
    { title: 'XP ПО ДНЯМ', data: dailyData, key: 'xp', color: '#5aaa6f' },
    { title: `ПОМОДОРО-СЕССИИ (${barRange} ДНЕЙ)`, data: barRange === '7' ? barData.last7 : barData.last30, key: 'pomodoro', color: '#ffb7c5' },
  ];

  const sportCharts = [
    { title: 'ТРЕНИРОВКИ ПО ДНЯМ', data: dailyData, key: 'workouts', color: 'var(--text-primary)' },
    { title: 'XP ТРЕНИРОВОК ПО ДНЯМ', data: dailyData, key: 'workoutXP', color: '#5aaa6f' },
    { title: `ДЛИТЕЛЬНОСТЬ ТРЕНИРОВОК (${barRange} ДНЕЙ)`, data: barRange === '7' ? barData.last7 : barData.last30, key: 'tasks', color: '#87ceeb' },
  ];

  const sportDurationData = useMemo(() => {
    const map: Record<string, { date: string; duration: number }> = {};
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      map[key] = { date: d.toLocaleDateString('ru', { day: 'numeric', month: 'short' }), duration: 0 };
    }
    workouts.filter(w => w.completed).forEach(w => {
      const key = w.date;
      if (map[key]) map[key].duration += w.duration;
    });
    return Object.values(map);
  }, [workouts]);

  const totalWorkoutStats = useMemo(() => ({
    total: workouts.length,
    completed: workouts.filter(w => w.completed).length,
    totalDuration: workouts.filter(w => w.completed).reduce((s, w) => s + w.duration, 0),
    totalXP: workouts.filter(w => w.completed).reduce((s, w) => s + w.xp, 0),
  }), [workouts]);

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>АНАЛИТИКА</h2>

      {/* Analytics tab selector: Tasks / Sport */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)' }}>
        {(['tasks','sport'] as const).map(t => (
          <button key={t} className={`tab-btn ${analyticsTab === t ? 'active' : ''}`} onClick={() => { setAnalyticsTab(t); setActiveChart(0); }}>
            {t === 'tasks' ? '📋 ЗАДАЧИ' : '🏋️ СПОРТ'}
          </button>
        ))}
      </div>

      {analyticsTab === 'tasks' && (
        <>
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
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    onClick={(_data, index) => setActivePieIndex(activePieIndex === index ? null : index)}
                    label={({ name, value, payload }: { name?: string; value?: number; payload?: Record<string, unknown> }) => `${(payload as Record<string, string>).emoji || ''} ${name || ''} (${value || 0})`}
                    labelLine={false}
                  >
                    {categoryData.map((d, i) => (
                      <Cell key={i} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]}
                        stroke={activePieIndex === i ? '#ffffff' : '#000000'}
                        strokeWidth={activePieIndex === i ? 3 : 2} />
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
        </>
      )}

      {analyticsTab === 'sport' && (
        <>
          {/* Sport stats */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', flexWrap: 'wrap' }}>
            <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
              <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{totalWorkoutStats.total}</div>
              <div className="micro-cap" style={{ marginTop: '4px' }}>Всего тренировок</div>
            </div>
            <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
              <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{totalWorkoutStats.completed}</div>
              <div className="micro-cap" style={{ marginTop: '4px' }}>Выполнено</div>
            </div>
            <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
              <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>{totalWorkoutStats.totalDuration} мин</div>
              <div className="micro-cap" style={{ marginTop: '4px' }}>Общее время</div>
            </div>
            <div className="card-panel" style={{ padding: '16px 24px', textAlign: 'center', minWidth: '100px', flex: 1 }}>
              <div style={{ fontSize: '28px', fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif', fontWeight: 700 }}>+{totalWorkoutStats.totalXP}</div>
              <div className="micro-cap" style={{ marginTop: '4px' }}>XP</div>
            </div>
          </div>

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
            {sportCharts.map((c, i) => (
              <button key={i} className={`tab-btn ${activeChart === i ? 'active' : ''}`} onClick={() => setActiveChart(i)}>
                {c.title}
              </button>
            ))}
          </div>

          {/* Active chart */}
          <div className="chart-container" style={{ marginBottom: '24px' }}>
            <h3 className="micro-cap" style={{ marginBottom: '20px' }}>{sportCharts[activeChart].title}</h3>
            {activeChart === 2
              ? renderChart(sportDurationData, 'duration', sportCharts[activeChart].color)
              : renderChart(sportCharts[activeChart].data, sportCharts[activeChart].key, sportCharts[activeChart].color)
            }
          </div>

          {/* Pie chart - workout type distribution */}
          <div className="chart-container">
            <h3 className="micro-cap" style={{ marginBottom: '20px' }}>РАСПРЕДЕЛЕНИЕ ПО ТИПАМ ТРЕНИРОВОК</h3>
            {workoutTypeData.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Нет данных для отображения</p>
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={workoutTypeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={120}
                    onClick={(_data, index) => setActiveSportPieIndex(activeSportPieIndex === index ? null : index)}
                    label={({ name, value, payload }: { name?: string; value?: number; payload?: Record<string, unknown> }) => {
                      const p = payload as Record<string, string> | undefined;
                      return `${p?.icon || ''} ${name || ''} (${value || 0})`;
                    }}
                    labelLine={false}
                  >
                    {workoutTypeData.map((d, i) => (
                      <Cell key={i} fill={d.color}
                        stroke={activeSportPieIndex === i ? '#ffffff' : '#000000'}
                        strokeWidth={activeSportPieIndex === i ? 3 : 2} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--hairline)', borderRadius: '4px', color: 'var(--text-primary)' }}
                    formatter={(_value, _name, props) => {
                      const p = props?.payload as Record<string, unknown> | undefined;
                      return [`${_value} тренировок (+${p?.xp || 0} XP, ${p?.duration || 0} мин)`, `${p?.icon || ''} ${_name}`];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </>
      )}
    </section>
  );
}
