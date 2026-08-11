import React from 'react';

export const SPORTS_EMOJI_LIST = [
  '🏃', '🏋️', '🏊', '🚴', '🧘', '🥊', '🎾', '🏔️', '💪', '⚽', '🏀', '🏈', '⚾', '🏐', '🏓', '🏸', '🥋', '⛸️', '🎿', '🛹',
  '🏄', '🚣', '🤸', '⛹️', '🤾', '🏌️', '🧗', '🚵', '🤼', '🎯', '🥏', '🏑', '🏒', '🥍', '🏹', '🛼', '🎽', '🤿', '🪂', '🏇',
  '🎳', '🥌', '🤺', '🏋', '⛷️', '🛶', '🏊‍♀️', '🏃‍♀️', '🧘‍♂️', '⭐', '🔥', '💥', '⚡', '🎖️', '🏅',
];

interface EmojiPickerProps {
  emoji: string;
  onSelect: (e: string) => void;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ emoji, onSelect, onClose }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        zIndex: 40,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--hairline)',
        borderRadius: '8px',
        padding: '8px',
        marginTop: '4px',
        width: '280px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(10, 1fr)',
          gap: '4px',
          maxHeight: '180px',
          overflowY: 'auto',
        }}
      >
        {SPORTS_EMOJI_LIST.map(e => (
          <button
            key={e}
            type="button"
            onClick={() => {
              onSelect(e);
              onClose();
            }}
            style={{
              background: emoji === e ? 'var(--ghost-hover)' : 'transparent',
              border: emoji === e ? '1px solid var(--text-primary)' : '1px solid transparent',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              fontSize: '18px',
              textAlign: 'center',
              lineHeight: 1,
            }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
};
