import { X } from 'lucide-react';
import { IconButton } from '@/components/ui/IconButton';
import { cx } from '@/lib/ui/cx';
import { dismissToast, useToasts } from '@/lib/ui/toast';
import styles from './Toaster.module.css';

/**
 * The toast stack, announced politely to screen readers. Mount it once per screen.
 * @returns The live region holding the current toasts.
 */
export function Toaster() {
  const toasts = useToasts();
  return (
    <div className={styles.toaster} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={cx(styles.toast, toast.tone === 'danger' && styles.danger)}>
          <span>{toast.message}</span>
          <IconButton label="Dismiss" onClick={() => dismissToast(toast.id)}>
            <X size={14} aria-hidden="true" />
          </IconButton>
        </div>
      ))}
    </div>
  );
}
