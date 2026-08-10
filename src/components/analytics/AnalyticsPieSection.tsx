import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from 'recharts';

const CHART_COLORS = ['#ffffff', '#f0f0fa', '#a0a0ff', '#5aaa6f', '#ffb7c5', '#ffd700', '#87ceeb', '#ff9eb5'];

interface AnalyticsPieSectionProps {
  data: any[];
  title: string;
  pieRef: React.RefObject<HTMLDivElement>;
  sportPieMode?: 'count' | 'duration';
  onModeChange?: (mode: 'count' | 'duration') => void;
  onSliceClick: (item: any) => void;
}

const renderActiveShape = (props: any, sportPieMode?: 'count' | 'duration') => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload } = props;
  const RADIAN = Math.PI / 180;
  const cos = Math.cos(-midAngle * RADIAN);
  const sin = Math.sin(-midAngle * RADIAN);
  const lineEndR = (outerRadius + 8) * 1.35;
  const textR = (outerRadius + 8) * 1.55;
  const ex = cx + lineEndR * cos;
  const ey = cy + lineEndR * sin;
  const tx = cx + textR * cos;
  const ty = cy + textR * sin;
  const color = payload?.color || fill || '#ffffff';
  const textAnchor = tx > cx ? 'start' : 'end';
  const icon = payload?.emoji || payload?.icon || '';
  const displayVal = sportPieMode === 'duration' ? `${payload?.duration || 0} мин` : `${payload?.value || 0}`;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        stroke="#ffffff"
        strokeWidth={2}
      />
      <path d={`M${cx + (outerRadius + 8) * cos},${cy + (outerRadius + 8) * sin}L${ex},${ey}`} stroke={color} strokeWidth={2} fill="none" />
      <text x={tx} y={ty} fill={color} textAnchor={textAnchor} dominantBaseline="central" fontSize={13} fontWeight={700}>
        {icon} {payload?.name} ({displayVal})
      </text>
    </g>
  );
};

export const AnalyticsPieSection: React.FC<AnalyticsPieSectionProps> = ({
  data,
  title,
  pieRef,
  sportPieMode,
  onModeChange,
  onSliceClick,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const activeProps = {
    activeIndex,
    activeShape: (props: any) => renderActiveShape(props, sportPieMode),
  };

  return (
    <div className="chart-container" ref={pieRef} style={{ outline: 'none' }} tabIndex={-1}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 className="micro-cap" style={{ margin: 0 }}>
          {title}
        </h3>
        {onModeChange && sportPieMode && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className="btn-ghost btn-ghost-xs"
              style={{ background: sportPieMode === 'count' ? 'var(--ghost-hover)' : 'transparent' }}
              onClick={() => onModeChange('count')}
            >
              КОЛИЧЕСТВО
            </button>
            <button
              className="btn-ghost btn-ghost-xs"
              style={{ background: sportPieMode === 'duration' ? 'var(--ghost-hover)' : 'transparent' }}
              onClick={() => onModeChange('duration')}
            >
              ВРЕМЯ
            </button>
          </div>
        )}
      </div>

      {data.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px' }}>Нет данных для отображения</p>
      ) : (
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={data}
              dataKey="currentValue"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              {...(activeProps as any)}
              isAnimationActive={true}
              animationDuration={600}
              animationEasing="ease-in-out"
              labelLine={false}
              rootTabIndex={-1}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              onMouseDown={(_data, index, e: any) => {
                e.preventDefault();
                const d = data[index];
                if (d) onSliceClick(d);
              }}
              label={({ cx, cy, midAngle, outerRadius, payload, index }: any) => {
                if (index === activeIndex) return null; // handled by renderActiveShape
                const RADIAN = Math.PI / 180;
                const cos = Math.cos(-midAngle * RADIAN);
                const sin = Math.sin(-midAngle * RADIAN);
                const lineEndR = outerRadius * 1.35;
                const textR = outerRadius * 1.55;
                const ex = cx + lineEndR * cos;
                const ey = cy + lineEndR * sin;
                const tx = cx + textR * cos;
                const ty = cy + textR * sin;
                const color = payload?.color || '#ffffff';
                const textAnchor = tx > cx ? 'start' : 'end';
                const icon = payload?.emoji || payload?.icon || '';
                const displayVal =
                  sportPieMode === 'duration'
                    ? `${payload?.duration || 0} мин`
                    : `${payload?.value || 0}`;

                return (
                  <g style={{ transition: 'all 0.3s ease' }}>
                    <path d={`M${cx + outerRadius * cos},${cy + outerRadius * sin}L${ex},${ey}`} stroke={color} strokeWidth={1.5} fill="none" />
                    <text x={tx} y={ty} fill={color} textAnchor={textAnchor} dominantBaseline="central" fontSize={12} fontWeight={600}>
                      {icon} {payload?.name} ({displayVal})
                    </text>
                  </g>
                );
              }}
            >
              {data.map((d, i) => (
                <Cell key={d.name || i} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
