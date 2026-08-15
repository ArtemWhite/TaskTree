import { createPortal } from 'react-dom';
import type { CSSProperties, ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  overlayStyle?: CSSProperties;
  contentStyle?: CSSProperties;
}

export default function Modal({ onClose, children, overlayStyle, contentStyle }: ModalProps) {
  return createPortal(
    <div className="modal-overlay" style={overlayStyle} onClick={onClose}>
      <div className="modal-content" style={contentStyle} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}
