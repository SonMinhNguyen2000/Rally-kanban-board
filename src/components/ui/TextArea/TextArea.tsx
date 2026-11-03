import type { ComponentProps } from 'react';
import { cx } from '@/lib/ui/cx';
import styles from './TextArea.module.css';

/**
 * A framed multi-line form input, matching TextInput. Set aria-invalid to show the error state.
 * @param props.className - Extra classes to add.
 * @param props.rest - Any other textarea attributes, passed to the element.
 * @returns The textarea element.
 */
export function TextArea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea {...props} className={cx(styles.textArea, className)} />;
}
