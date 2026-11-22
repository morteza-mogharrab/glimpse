import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from '../icons/Icons';

interface ModalProps {
  onClose(): void;
  children: ReactNode;
  className?: string;
  /** Show the white "×" in the top right corner of the overlay. */
  closeButton?: boolean;
  label?: string;
  /** Darker overlay used by the post viewer and stories. */
  dim?: 'normal' | 'heavy';
}

let openCount = 0;

export function Modal({ onClose, children, className = '', closeButton = false, label, dim = 'normal' }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    openCount++;
    document.body.classList.add('modal-open');
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener('keydown', onKey);
      if (--openCount === 0) document.body.classList.remove('modal-open');
      prev?.focus?.({ preventScroll: true });
    };
  }, []);

  return createPortal(
    <div className={`overlay overlay-${dim}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      {closeButton && (
        <button className="overlay-close" onClick={onClose} aria-label="Close"><CloseIcon size={26} /></button>
      )}
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label}
        className={`modal ${className}`}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

export interface SheetAction {
  label: string;
  onClick?(): void;
  tone?: 'danger' | 'bold';
  /** Don't close the sheet (e.g. the action opens a confirm step). */
  keepOpen?: boolean;
}

/** Instagram-style action list ("…" menus). The last row is always Cancel. */
export function ActionSheet({ actions, onClose }: { actions: SheetAction[]; onClose(): void }) {
  return (
    <Modal onClose={onClose} className="sheet" label="Options">
      {actions.map((a) => (
        <button key={a.label} className={`sheet-row ${a.tone ?? ''}`}
          onClick={() => { if (!a.keepOpen) onClose(); a.onClick?.(); }}>
          {a.label}
        </button>
      ))}
      <button className="sheet-row" onClick={onClose}>Cancel</button>
    </Modal>
  );
}

/** Simple confirm dialog (window.confirm is blocked in sandboxed frames). */
export function Confirm({ title, body, confirmLabel, onConfirm, onClose }: {
  title: string; body?: string; confirmLabel: string; onConfirm(): void; onClose(): void;
}) {
  return (
    <Modal onClose={onClose} className="sheet" label={title}>
      <div className="confirm-head">
        <h3>{title}</h3>
        {body && <p>{body}</p>}
      </div>
      <button className="sheet-row danger" onClick={() => { onClose(); onConfirm(); }}>{confirmLabel}</button>
      <button className="sheet-row" onClick={onClose}>Cancel</button>
    </Modal>
  );
}
