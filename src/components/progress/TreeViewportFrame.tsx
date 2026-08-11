import React from 'react';
import { TreeVisualizer } from './TreeVisualizer';

interface Props {
  viewFractionalStage: number;
  baseSize: number;
  treeZoom: number;
  panOffset: { x: number; y: number };
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
}

export const TreeViewportFrame: React.FC<Props> = ({
  viewFractionalStage,
  baseSize,
  treeZoom,
  panOffset,
  isDragging,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onWheel,
  onZoomIn,
  onZoomOut,
  onResetView,
}) => {
  return (
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
          boxShadow:
            '0 0 16px rgba(90, 170, 111, 0.2), inset 0 0 24px rgba(0, 0, 0, 0.6), 0 8px 32px rgba(0, 0, 0, 0.4)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
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
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          🖐️ Зажмите для перемещения · 📜 Колёсико для зума
        </div>
      </div>

      {/* Zoom & Reset Controls */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button className="btn-ghost btn-ghost-xs" onClick={onZoomOut} title="Уменьшить">
          🔍 -
        </button>
        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-primary)',
            minWidth: '48px',
            textAlign: 'center',
            fontWeight: 700,
          }}
        >
          {Math.round(treeZoom * 100)}%
        </span>
        <button className="btn-ghost btn-ghost-xs" onClick={onZoomIn} title="Увеличить">
          🔍 +
        </button>
        <button className="btn-ghost btn-ghost-xs" onClick={onResetView} title="Сбросить позицию и зум">
          🎯 СБРОС
        </button>
      </div>
    </div>
  );
};
