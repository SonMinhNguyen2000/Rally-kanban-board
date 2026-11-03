import type { ReactNode } from 'react';
import styles from './FieldError.module.css';

/**
 * A validation message, announced when it appears. Point aria-describedby at `id`.
 * @param props.id - Optional id for the field to reference.
 * @param props.children - The message.
 * @returns The message element.
 */
export function FieldError({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className={styles.error} role="alert">
      {children}
    </p>
  );
}
