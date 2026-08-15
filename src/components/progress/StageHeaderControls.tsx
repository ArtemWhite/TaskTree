import React from 'react';
import { ProgressService } from '../../services/ProgressService';

interface Props {
  displayStage: number;
  treeStage: number;
  isViewingPastStage: boolean;
  sideLayout?: boolean;
  onPrevStage: () => void;
  onNextStage: () => void;
  onResetStage: () => void;
}

export const StageHeaderControls: React.FC<Props> = ({
  displayStage,
  treeStage,
  isViewingPastStage,
  sideLayout,
  onPrevStage,
  onNextStage,
  onResetStage,
}) => {
  return (
    <>
      <div
        style={{
          position: 'relative',
          marginBottom: '8px',
          height: '76px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          className="btn-ghost btn-ghost-xs"
          onClick={onPrevStage}
          disabled={displayStage <= 0}
          style={{
            position: 'absolute',
            left: sideLayout ? 0 : '5%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            width: '36px',
            height: '36px',
            padding: 0,
            fontSize: '18px',
            borderRadius: '50%',
            border: 'none',
          }}
          title="Предыдущая стадия"
        >
          ◀
        </button>

        <div
          style={{
            fontSize: '22px',
            fontFamily: '"D-DIN-Bold","Inter","Arial Narrow",sans-serif',
            fontWeight: 700,
            letterSpacing: '0.96px',
            textTransform: 'uppercase',
            lineHeight: '1.25',
            textAlign: 'center',
            padding: '0 60px',
            maxHeight: '76px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {ProgressService.getStageName(displayStage)}
        </div>

        <button
          className="btn-ghost btn-ghost-xs"
          onClick={onNextStage}
          disabled={displayStage >= treeStage}
          style={{
            position: 'absolute',
            right: sideLayout ? 0 : '5%',
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 2,
            width: '36px',
            height: '36px',
            padding: 0,
            fontSize: '18px',
            borderRadius: '50%',
            border: 'none',
          }}
          title="Следующая стадия"
        >
          ▶
        </button>
      </div>

      <div
        style={{
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sideLayout ? 'flex-start' : 'center',
          gap: '6px',
          fontSize: '13px',
          color: 'var(--text-muted)',
          marginBottom: '8px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}
      >
        {isViewingPastStage && (
          <span
            style={{
              fontSize: '10px',
              color: '#ff9f43',
              background: 'rgba(255, 159, 67, 0.12)',
              padding: '1px 6px',
              borderRadius: '4px',
              border: '1px solid rgba(255, 159, 67, 0.3)',
              fontWeight: 700,
            }}
          >
            ПРОСМОТР
          </span>
        )}
        <span>Стадия {displayStage + 1}/50</span>
      </div>

      <div
        style={{
          height: '32px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sideLayout ? 'flex-start' : 'center',
        }}
      >
        <button
          className="btn-ghost btn-ghost-xs"
          onClick={onResetStage}
          style={{ visibility: isViewingPastStage ? 'visible' : 'hidden' }}
        >
          ↩ К ТЕКУЩЕЙ
        </button>
      </div>
    </>
  );
};
