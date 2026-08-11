import { useState } from 'react';
import type { TreeStage, PomodoroSession } from '../types';
import { ProgressService } from '../services/ProgressService';
import { useTreeInteractiveView } from '../hooks/useTreeInteractiveView';
import { TreeViewportFrame } from './progress/TreeViewportFrame';
import { StageHeaderControls } from './progress/StageHeaderControls';
import { StageProgressBar } from './progress/StageProgressBar';
import { ProgressStatsGrid } from './progress/ProgressStatsGrid';
import PomodoroHistoryModal from './common/PomodoroHistoryModal';

interface Props {
  totalXP: number;
  treeStage: TreeStage;
  levelInfo: { current: number; next: number; level: number };
  activeCount: number;
  completedCount: number;
  pomodoroSessions: number;
  pomodoroHistory?: PomodoroSession[];
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
  totalXP,
  treeStage,
  levelInfo,
  activeCount,
  completedCount,
  pomodoroSessions,
  pomodoroHistory = [],
  workoutsCount = 0,
  workoutsDuration = 0,
  booksCount = 0,
  booksPages = 0,
  large,
  zoom = 1.15,
  sideLayout,
  treeSize,
}: Props) {
  const baseSize = treeSize || (large ? 320 : 200);
  const [showPomodoroModal, setShowPomodoroModal] = useState(false);

  const {
    displayStage,
    isViewingPastStage,
    viewFractionalStage,
    treeZoom,
    panOffset,
    isDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    setTreeZoom,
    resetView,
    nextStage,
    prevStage,
    resetStage,
  } = useTreeInteractiveView({
    treeStage,
    levelInfo,
    initialZoom: zoom,
  });

  const viewportFrame = (
    <TreeViewportFrame
      viewFractionalStage={viewFractionalStage}
      baseSize={baseSize}
      treeZoom={treeZoom}
      panOffset={panOffset}
      isDragging={isDragging}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      onZoomIn={() => setTreeZoom(z => Math.min(3.5, z + 0.15))}
      onZoomOut={() => setTreeZoom(z => Math.max(0.6, z - 0.15))}
      onResetView={resetView}
    />
  );

  const headerControls = (
    <StageHeaderControls
      displayStage={displayStage}
      treeStage={treeStage}
      isViewingPastStage={isViewingPastStage}
      sideLayout={sideLayout}
      onPrevStage={prevStage}
      onNextStage={nextStage}
      onResetStage={resetStage}
    />
  );

  const statsGrid = (
    <ProgressStatsGrid
      activeCount={activeCount}
      completedCount={completedCount}
      pomodoroSessions={pomodoroSessions}
      workoutsCount={workoutsCount}
      workoutsDuration={workoutsDuration}
      booksCount={booksCount}
      booksPages={booksPages}
      onShowPomodoroHistory={() => setShowPomodoroModal(true)}
    />
  );

  return (
    <>
      {sideLayout ? (
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Info panel — left side */}
          <div style={{ flex: '0 0 340px', minWidth: '280px' }}>
            <p className="micro-cap" style={{ marginBottom: '8px' }}>
              ДЕРЕВО ПРОГРЕССА
            </p>
            {headerControls}
            <StageProgressBar levelInfo={levelInfo} totalXP={totalXP} sideLayout={sideLayout} />
            {statsGrid}
          </div>

          {/* Viewport frame — right side */}
          <div style={{ flex: 1, minWidth: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {viewportFrame}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
            {viewportFrame}
          </div>

          <p className="micro-cap" style={{ marginBottom: '8px' }}>
            ДЕРЕВО ПРОГРЕССА
          </p>
          {headerControls}
          <StageProgressBar levelInfo={levelInfo} totalXP={totalXP} sideLayout={sideLayout} />
          {statsGrid}
        </div>
      )}

      {showPomodoroModal && (
        <PomodoroHistoryModal
          title="Все выполненные фокус-сессии"
          sessions={pomodoroHistory}
          onClose={() => setShowPomodoroModal(false)}
        />
      )}
    </>
  );
}
