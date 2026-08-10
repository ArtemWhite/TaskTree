import { useState, useRef } from 'react';
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

interface SectorInfo {
  startAngle: number;
  endAngle: number;
  cx: number;
  cy: number;
}

export const AnalyticsPieSection: React.FC<AnalyticsPieSectionProps> = ({
  data,
  title,
  pieRef,
  sportPieMode,
  onModeChange,
  onSliceClick,
}) => {
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const sectorInfoMapRef = useRef<Record<number, SectorInfo>>({});

  const activeSectorInfo = activeIndex >= 0 ? sectorInfoMapRef.current[activeIndex] : null;
  const activeItem = activeIndex >= 0 ? data[activeIndex] : null;

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
              isAnimationActive={false}
              labelLine={false}
              rootTabIndex={-1}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
              onMouseDown={(_data, index, e: any) => {
                e.preventDefault();
                const d = data[index];
                if (d) onSliceClick(d);
              }}
              label={({ cx, cy, midAngle, startAngle, endAngle, outerRadius, payload, index }: any) => {
                if (startAngle !== undefined && endAngle !== undefined && cx !== undefined && cy !== undefined) {
                  sectorInfoMapRef.current[index] = { startAngle, endAngle, cx, cy };
                }

                const isActive = index === activeIndex;
                const currentOuterR = isActive ? outerRadius + 8 : outerRadius;
                const RADIAN = Math.PI / 180;
                const cos = Math.cos(-midAngle * RADIAN);
                const sin = Math.sin(-midAngle * RADIAN);
                const lineEndR = currentOuterR * 1.35;
                const textR = currentOuterR * 1.55;
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
                  <g style={{ opacity: activeIndex === -1 || isActive ? 1 : 0.7 }}>
                    <path
                      d={`M${cx + currentOuterR * cos},${cy + currentOuterR * sin}L${ex},${ey}`}
                      stroke={color}
                      strokeWidth={isActive ? 2 : 1.5}
                      fill="none"
                    />
                    <text
                      x={tx}
                      y={ty}
                      fill={color}
                      textAnchor={textAnchor}
                      dominantBaseline="central"
                      fontSize={isActive ? 13 : 12}
                      fontWeight={isActive ? 700 : 600}
                    >
                      {icon} {payload?.name} ({displayVal})
                    </text>
                  </g>
                );
              }}
            >
              {data.map((d, i) => (
                <Cell key={d.name || i} fill={d.color || CHART_COLORS[i % CHART_COLORS.length]} stroke="none" style={{ cursor: 'pointer' }} />
              ))}
            </Pie>

            {/* Custom active sector overlay */}
            {activeSectorInfo && activeItem && (
              <Sector
                cx={activeSectorInfo.cx}
                cy={activeSectorInfo.cy}
                innerRadius={0}
                outerRadius={108}
                startAngle={activeSectorInfo.startAngle}
                endAngle={activeSectorInfo.endAngle}
                fill={activeItem.color || CHART_COLORS[activeIndex % CHART_COLORS.length]}
                stroke="#ffffff"
                strokeWidth={2}
                style={{ pointerEvents: 'none' }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
