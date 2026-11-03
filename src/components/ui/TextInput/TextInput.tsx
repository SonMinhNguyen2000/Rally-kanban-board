import type { ComponentProps } from 'react';
import { cx } from '@/lib/ui/cx';
import styles from './TextInput.module.css';

/**
 * A framed form input. Set aria-invalid to show the error state.
 * @param props.className - Extra classes to add.
 * @param props.rest - Any other input attributes, passed to the element.
 * @returns The input element.
 */
export function TextInput({ className, ...props }: ComponentProps<'input'>) {
  return <input {...props} className={cx(styles.input, className)} />;
}
