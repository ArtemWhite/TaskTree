import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { Task, Category, PomodoroSession, ChartType, Workout } from '../types';
import { WorkoutService } from '../services/WorkoutService';
import { AnalyticsService } from '../services/AnalyticsService';
import { useAnimatedPieData } from '../hooks/useAnimatedPieData';
import { AnalyticsCharts } from './analytics/AnalyticsCharts';
import { AnalyticsPieSection } from './analytics/AnalyticsPieSection';
import { AnalyticsPopupModal, type PopupData, type PopupItem } from './analytics/AnalyticsPopupModal';

interface Props {
  tasks: Task[];
  pomodoroHistory: PomodoroSession[];
  categories: Category[];
  workouts: Workout[];
}

export default function Analytics({ tasks, pomodoroHistory, categories, workouts }: Props) {
  const [activeChart, setActiveChart] = useState(0);
  const [analyticsTab, setAnalyticsTab] = useState<'tasks' | 'sport'>('tasks');
  const [popupData, setPopupData] = useState<PopupData | null>(null);
  const [sportPieMode, setSportPieMode] = useState<'count' | 'duration'>('count');
  const [barRange, setBarRange] = useState<'7' | '30'>('7');
  const [chartType, setChartType] = useState<ChartType>('bar');

  const catPieRef = useRef<HTMLDivElement>(null);
  const sportPieRef = useRef<HTMLDivElement>(null);

  const closePopup = () => setPopupData(null);

  useLayoutEffect(() => {
    [catPieRef, sportPieRef].forEach(ref => {
      if (ref.current) {
        ref.current.querySelectorAll('*').forEach(el => {
          (el as HTMLElement).style.outline = 'none';
        });
        const svg = ref.current.querySelector('svg');
        if (svg) {
          svg.setAttribute('focusable', 'false');
          svg.style.outline = 'none';
        }
        ref.current.style.outline = 'none';
      }
    });
  }, [analyticsTab]);

  const dailyData = useMemo(
    () => AnalyticsService.calculateDailyData(tasks, pomodoroHistory, workouts),
    [tasks, pomodoroHistory, workouts]
  );

  const categoryData = useMemo(
    () => AnalyticsService.calculateCategoryDistribution(tasks, categories).map(d => ({ ...d, currentValue: d.value })),
    [tasks, categories]
  );

  const barData = useMemo(() => ({ last7: dailyData.slice(-7), last30: dailyData }), [dailyData]);

  const workoutTypeData = useMemo(() => {
    const map: Record<string, { name: string; value: number; xp: number; duration: number; color: string; icon: string; tasks: PopupItem[] }> = {};
    workouts.filter(w => w.completed).forEach(w => {
      if (!map[w.workoutType]) {
        map[w.workoutType] = {
          name: w.workoutType,
          value: 0,
          xp: 0,
          duration: 0,
          color: WorkoutService.getTypeColor(w.workoutType),
          icon: WorkoutService.getTypeIcon(w.workoutType),
          tasks: [],
        };
      }
      map[w.workoutType].value++;
      map[w.workoutType].xp += w.xp;
      map[w.workoutType].duration += w.duration;
      map[w.workoutType].tasks.push({ title: w.title || w.workoutType, date: w.date, xp: w.xp, pomodoro: 0, duration: w.duration });
    });
    return Object.values(map).filter(d => d.value > 0);
  }, [workouts]);

  const animatedWorkoutTypeData = useAnimatedPieData(workoutTypeData, sportPieMode, 350);

  const charts = [
    { title: 'ВЫПОЛНЕНИЕ ЗАДАЧ ПО ДНЯМ', data: dailyData, key: 'tasks', color: 'var(--text-primary)' },
    { title: 'XP ПО ДНЯМ', data: dailyData, key: 'xp', color: '#5aaa6f' },
    { title: `ПОМОДОРО-СЕССИИ (${barRange} ДНЕЙ)`, data: barRange === '7' ? barData.last7 : barData.last30, key: 'pomodoro', color: '#ffb7c5' },
  ];

  const sportDurationData = useMemo(
    () => AnalyticsService.calculateSportDurationData(workouts),
    [workouts]
  );

  const sportCharts = [
    { title: 'ТРЕНИРОВКИ ПО ДНЯМ', data: dailyData, key: 'workouts', color: 'var(--text-primary)' },
    { title: 'XP ТРЕНИРОВОК ПО ДНЯМ', data: dailyData, key: 'workoutXP', color: '#5aaa6f' },
    { title: `ДЛИТЕЛЬНОСТЬ ТРЕНИРОВОК (${barRange} ДНЕЙ)`, data: barRange === '7' ? sportDurationData.slice(-7) : sportDurationData, key: 'duration', color: '#87ceeb' },
  ];

  const totalWorkoutStats = useMemo(() => WorkoutService.calculateWorkoutStats(workouts), [workouts]);

  return (
    <section>
      <h2 className="section-heading" style={{ marginBottom: '32px', fontSize: '36px' }}>АНАЛИТИКА</h2>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--hairline)' }}>
        {(['tasks', 'sport'] as const).map(t => (
          <button key={t} className={`tab-btn ${analyticsTab === t ? 'active' : ''}`} onClick={() => { setAnalyticsTab(t); setActiveChart(0); }}>
            {t === 'tasks' ? '📋 ЗАДАЧИ' : '🏋️ СПОРТ'}
          </button>
        ))}
      </div>

      <div key={analyticsTab} className="tab-fade-in">
        {analyticsTab === 'tasks' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="micro-cap" style={{ fontSize: '10px', marginRight: '8px' }}>ТИП ГРАФИКА:</span>
              {(['bar', 'line', 'area', 'dot'] as ChartType[]).map(t => (
                <button key={t} className="btn-ghost btn-ghost-xs" style={{ background: chartType === t ? 'var(--ghost-hover)' : 'transparent' }} onClick={() => setChartType(t)}>
                  {t === 'bar' ? 'СТОЛБЦЫ' : t === 'line' ? 'ЛИНИИ' : t === 'area' ? 'ОБЛАСТЬ' : 'ТОЧКИ'}
                </button>
              ))}
              <span className="micro-cap" style={{ fontSize: '10px', marginLeft: '16px', marginRight: '8px' }}>ПЕРИОД:</span>
              <button className="btn-ghost btn-ghost-xs" style={{ background: barRange === '7' ? 'var(--ghost-hover)' : 'transparent' }} onClick={() => setBarRange('7')}>7 ДНЕЙ</button>
              <button className="btn-ghost btn-ghost-xs" style={{ background: barRange === '30' ? 'var(--ghost-hover)' : 'transparent' }} onClick={() => setBarRange('30')}>30 ДНЕЙ</button>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {charts.map((c, i) => (
                <button key={i} className={`tab-btn ${activeChart === i ? 'active' : ''}`} onClick={() => setActiveChart(i)}>
                  {c.title}
                </button>
              ))}
            </div>

            <div className="chart-container" style={{ marginBottom: '24px' }}>
              <h3 className="micro-cap" style={{ marginBottom: '20px' }}>{charts[activeChart].title}</h3>
              <AnalyticsCharts data={charts[activeChart].data} dataKey={charts[activeChart].key} color={charts[activeChart].color} chartType={chartType} />
            </div>

            <AnalyticsPieSection
              data={categoryData}
              title="РАСПРЕДЕЛЕНИЕ ПО КАТЕГОРИЯМ"
              pieRef={catPieRef}
              onSliceClick={d => setPopupData({ emoji: d.emoji ?? '', name: d.name, color: d.color, xp: d.xp, items: d.tasks })}
            />
          </>
        )}

        {analyticsTab === 'sport' && (
          <>
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

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="micro-cap" style={{ fontSize: '10px', marginRight: '8px' }}>ТИП ГРАФИКА:</span>
              {(['bar', 'line', 'area', 'dot'] as ChartType[]).map(t => (
                <button key={t} className="btn-ghost btn-ghost-xs" style={{ background: chartType === t ? 'var(--ghost-hover)' : 'transparent' }} onClick={() => setChartType(t)}>
                  {t === 'bar' ? 'СТОЛБЦЫ' : t === 'line' ? 'ЛИНИИ' : t === 'area' ? 'ОБЛАСТЬ' : 'ТОЧКИ'}
                </button>
              ))}
              <span className="micro-cap" style={{ fontSize: '10px', marginLeft: '16px', marginRight: '8px' }}>ПЕРИОД:</span>
              <button className="btn-ghost btn-ghost-xs" style={{ background: barRange === '7' ? 'var(--ghost-hover)' : 'transparent' }} onClick={() => setBarRange('7')}>7 ДНЕЙ</button>
              <button className="btn-ghost btn-ghost-xs" style={{ background: barRange === '30' ? 'var(--ghost-hover)' : 'transparent' }} onClick={() => setBarRange('30')}>30 ДНЕЙ</button>
            </div>

            <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', flexWrap: 'wrap' }}>
              {sportCharts.map((c, i) => (
                <button key={i} className={`tab-btn ${activeChart === i ? 'active' : ''}`} onClick={() => setActiveChart(i)}>
                  {c.title}
                </button>
              ))}
            </div>

            <div className="chart-container" style={{ marginBottom: '24px' }}>
              <h3 className="micro-cap" style={{ marginBottom: '20px' }}>{sportCharts[activeChart].title}</h3>
              <AnalyticsCharts data={sportCharts[activeChart].data} dataKey={sportCharts[activeChart].key} color={sportCharts[activeChart].color} chartType={chartType} />
            </div>

            <AnalyticsPieSection
              data={animatedWorkoutTypeData}
              title="РАСПРЕДЕЛЕНИЕ ПО ТИПАМ ТРЕНИРОВОК"
              pieRef={sportPieRef}
              sportPieMode={sportPieMode}
              onModeChange={setSportPieMode}
              onSliceClick={d => setPopupData({ emoji: d.icon ?? '', name: d.name, color: d.color, xp: d.xp, items: d.tasks })}
            />
          </>
        )}
      </div>

      {popupData && <AnalyticsPopupModal popupData={popupData} pomodoroHistory={pomodoroHistory} onClose={closePopup} />}
    </section>
  );
}
