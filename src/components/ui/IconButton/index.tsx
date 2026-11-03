import type { ComponentProps } from 'react';
import { cx } from '@/lib/ui/cx';
import styles from './IconButton.module.css';

/**
 * A square button holding only an icon. `label` names it for assistive technology and on hover.
 * @param props.label - The accessible name and hover title.
 * @param props.className - Extra classes to add.
 * @param props.rest - Any other button attributes, including the icon as children.
 * @returns The button element.
 */
export function IconButton({ label, className, ...props }: ComponentProps<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      {...props}
      className={cx(styles.iconButton, className)}
    />
  );
}
