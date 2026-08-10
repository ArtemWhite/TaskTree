import React, { useEffect, useRef, useState } from 'react';
import type { TreeStage } from '../types';
import { ProgressService } from '../services/ProgressService';
import { TreeVisualizer } from './progress/TreeVisualizer';
import { ProgressStatsGrid } from './progress/ProgressStatsGrid';

interface Props {
  totalXP: number;
  treeStage: TreeStage;
  levelInfo: { current: number; next: number; level: number };
  activeCount: number;
  completedCount: number;
  pomodoroSessions: number;
  workoutsCount?: number;
  workoutsDuration?: number;
  booksCount?: number;
  booksPages?: number;
  large?: boolean;
  zoom?: number;
  sideLayout?: boolean;
  treeSize?: number;
}

export const STAGE_NAMES = ProgressService.STAGE_NAMES;

export default function ProgressSection({
  totalXP, treeStage, levelInfo, activeCount, completedCount, pomodoroSessions,
  workoutsCount = 0, workoutsDuration = 0, booksCount = 0, booksPages = 0,
  large, zoom = 1, sideLayout, treeSize
}: Props) {
  const baseSize = treeSize || (large ? 320 : 200);
  const [viewStage, setViewStage] = useState<number | null>(null);
  const [treeZoom, setTreeZoom] = useState<number>(zoom || 1.15);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number } | null>(null);
  const prevTreeStageRef = useRef(treeStage);
  const displayStage = viewStage ?? treeStage;
  const isViewingPastStage = viewStage !== null && viewStage < treeStage;

  useEffect(() => {
    if (treeStage > prevTreeStageRef.current) setViewStage(null);
    prevTreeStageRef.current = treeStage;
  }, [treeStage]);

  const actualFractionalStage = treeStage + (levelInfo.next > 0 ? Math.min(1, levelInfo.current / levelInfo.next) : 0);
  const viewFractionalStage = isViewingPastStage
    ? Math.min(displayStage + 0.95, 49)
    : actualFractionalStage;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startPanX: panOffset.x,
      startPanY: panOffset.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPanOffset({
      x: dragStartRef.current.startPanX + dx,
      y: dragStartRef.current.startPanY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    dragStartRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY < 0 ? 0.15 : -0.15;
    setTreeZoom(z => Math.max(0.6, Math.min(3.5, z + delta)));
  };

  const resetView = () => {
    setTreeZoom(1.15);
    setPanOffset({ x: 0, y: 0 });
  };

  const ViewportFrame = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      {/* Static Bounded Box Container with High-Contrast Visible Border */}
      <div
        style={{
          width: '460px',
          height: '460px',
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: '20px',
          background: 'rgba(20, 20, 28, 0.75)',
          border: '2px solid rgba(90, 170, 111, 0.6)',
          boxShadow: '0 0 16px rgba(90, 170, 111, 0.2), inset 0 0 24px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            transition: isDragging ? 'none' : 'transform 0.08s ease-out',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TreeVisualizer viewFractionalStage={viewFractionalStage} size={baseSize} zoom={treeZoom} />
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            fontSize: '11px',
            color: 'var(--text-soft)',
            background: 'rgba(0, 0, 0, 0.75)',
            padding: '4px 10px',
            borderRadius: '6px',
            pointerEvents: 'none',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          🖐️ Зажмите для перемещения · 📜 Колёсико для зума
        </div>
      </div>

      {/* Zoom & Reset Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-ghost btn-ghost-xs" onClick={() => setTreeZoom(z => Math.max(0.6, z - 0.15))} title="Уменьшить">🔍 -</button>
        <span style={{ fontSize: '12px', color: 'var(--text-primary)', minWidth: '48px', textAlign: 'center', fontWeight: 700 }}>{Math.round(treeZoom * 100)}%</span>
        <button className="btn-ghost btn-ghost-xs" onClick={() => setTreeZoom(z => Math.min(3.5, z + 0.15))} title="Увеличить">🔍 +</button>
        <button className="btn-ghost btn-ghost-xs" onClick={resetView} title="Сбросить позицию и зум">🎯 СБРОС</button>
      </div>
    </div>
  );

  const StageHeader = (
    <div style={{ position: 'relative', marginBottom: '8px', height: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <button
        className="btn-ghost btn-ghost-xs"
        onClick={() => { const prev = displayStage - 1; setViewStage(prev <= 0 ? 0 : prev); }}
        disabled={displayStage <= 0}
        style={{ position: 'absolute', left: sideLayout ? 0 : '5%', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
        title="Предыдущая стадия"
      >◀</button>
      <div style={{
        fontSize: '22px',
        fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
        fontWeight: 700,
        letterSpacing: '0.96px',
        textTransform: 'uppercase',
        lineHeight: '1.25',
        textAlign: 'center',
        padding: '0 48px',
        maxHeight: '76px',
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}>
        {ProgressService.getStageName(displayStage)}
      </div>
      <button
        className="btn-ghost btn-ghost-xs"
        onClick={() => setViewStage(displayStage + 1)}
        disabled={displayStage >= treeStage}
        style={{ position: 'absolute', right: sideLayout ? 0 : '5%', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}
        title="Следующая стадия"
      >▶</button>
    </div>
  );

  const StageSubtitle = (
    <div style={{
      height: '24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: sideLayout ? 'flex-start' : 'center',
      gap: '6px',
      fontSize: '13px',
      color: 'var(--text-muted)',
      marginBottom: '8px',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }}>
      {isViewingPastStage && (
        <span style={{ fontSize: '10px', color: '#ff9f43', background: 'rgba(255, 159, 67, 0.12)', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(255, 159, 67, 0.3)', fontWeight: 700 }}>
          ПРОСМОТР
        </span>
      )}
      <span>Стадия {displayStage + 1}/50</span>
      <span>·</span>
      <span>Уровень {levelInfo.level}</span>
      <span>·</span>
      <span>{totalXP} XP</span>
    </div>
  );

  const ReturnToCurrentButton = (
    <div style={{ height: '32px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: sideLayout ? 'flex-start' : 'center' }}>
      <button
        className="btn-ghost btn-ghost-xs"
        onClick={() => setViewStage(null)}
        style={{ visibility: isViewingPastStage ? 'visible' : 'hidden' }}
      >
        ↩ К ТЕКУЩЕЙ
      </button>
    </div>
  );

  if (sideLayout) {
    return (
      <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* Info panel — left side */}
        <div style={{ flex: '0 0 340px', minWidth: '280px' }}>
          <p className="micro-cap" style={{ marginBottom: '8px' }}>ДЕРЕВО ПРОГРЕССА</p>
          {StageHeader}
          {StageSubtitle}
          {ReturnToCurrentButton}
          <div style={{ width: '100%', maxWidth: '300px' }}>
            <div className="progress-bar" style={{ height: '4px' }}>
              <div className="progress-bar-fill" style={{ width: `${levelInfo.next > 0 ? (levelInfo.current / levelInfo.next) * 100 : 100}%`, height: '100%' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
              <span>{levelInfo.current} XP</span>
              <span>{levelInfo.next} XP</span>
            </div>
          </div>

          <ProgressStatsGrid
            activeCount={activeCount}
            completedCount={completedCount}
            pomodoroSessions={pomodoroSessions}
            workoutsCount={workoutsCount}
            workoutsDuration={workoutsDuration}
            booksCount={booksCount}
            booksPages={booksPages}
          />
        </div>

        {/* Viewport frame — right side */}
        <div style={{ flex: 1, minWidth: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {ViewportFrame}
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        {ViewportFrame}
      </div>

      <p className="micro-cap" style={{ marginBottom: '8px' }}>ДЕРЕВО ПРОГРЕССА</p>
      {StageHeader}
      {StageSubtitle}
      {ReturnToCurrentButton}

      <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto 24px' }}>
        <div className="progress-bar" style={{ height: '4px' }}>
          <div className="progress-bar-fill" style={{ width: `${levelInfo.next > 0 ? (levelInfo.current / levelInfo.next) * 100 : 100}%`, height: '100%' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.8px' }}>
          <span>{levelInfo.current} XP</span>
          <span>{levelInfo.next} XP</span>
        </div>
      </div>

      <ProgressStatsGrid
        activeCount={activeCount}
        completedCount={completedCount}
        pomodoroSessions={pomodoroSessions}
        workoutsCount={workoutsCount}
        workoutsDuration={workoutsDuration}
        booksCount={booksCount}
        booksPages={booksPages}
      />
    </div>
  );
}
