import { useState, useEffect, useRef } from 'react';
import type { TreeStage } from '../types';

interface UseTreeInteractiveViewOptions {
  treeStage: TreeStage;
  levelInfo: { current: number; next: number; level: number };
  initialZoom?: number;
}

export function useTreeInteractiveView({ treeStage, levelInfo, initialZoom = 1.15 }: UseTreeInteractiveViewOptions) {
  const [viewStage, setViewStage] = useState<number | null>(null);
  const [treeZoom, setTreeZoom] = useState<number>(initialZoom);
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
  const viewFractionalStage = isViewingPastStage ? Math.min(displayStage + 0.5, 49) : actualFractionalStage;

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
    setTreeZoom(initialZoom);
    setPanOffset({ x: 0, y: 0 });
  };

  const nextStage = () => {
    const next = displayStage + 1;
    setViewStage(next >= treeStage ? null : next);
  };

  const prevStage = () => {
    const prev = displayStage - 1;
    setViewStage(prev <= 0 ? 0 : prev);
  };

  const resetStage = () => {
    setViewStage(null);
  };

  return {
    viewStage,
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
  };
}
