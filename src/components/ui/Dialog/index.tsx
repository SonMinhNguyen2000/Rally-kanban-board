import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { IconButton } from '@/components/ui/IconButton';
import styles from './Dialog.module.css';

/**
 * A native modal dialog: focus trap, Escape and the inert background come from the browser.
 * @param props.title - The heading, which also names the dialog for assistive technology.
 * @param props.onClose - Called on Escape, the close button or a press on the backdrop.
 * @param props.children - The dialog body.
 * @param props.footer - Optional actions shown under the body.
 * @returns The dialog element.
 */
export function Dialog({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId(); // Unique because dialogs can nest.

  useEffect(() => {
    const dialog = ref.current;
    // Where focus goes back to. The browser can't restore it, because this effect's cleanup
    // runs after the dialog has left the DOM.
    const opener = document.activeElement as HTMLElement | null;

    if (dialog && !dialog.open) {
      dialog.showModal();
      // React's autoFocus runs before showModal, which then moves focus to the first control.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }

    return () => {
      dialog?.close();
      if (opener?.isConnected) opener.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={styles.dialog}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        if (event.target === ref.current) onClose(); // A press on the backdrop.
      }}
    >
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 id={titleId}>{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </IconButton>
        </header>
        <div className={styles.body}>{children}</div>
        {footer && <footer className={styles.foot}>{footer}</footer>}
      </div>
    </dialog>
  );
}
