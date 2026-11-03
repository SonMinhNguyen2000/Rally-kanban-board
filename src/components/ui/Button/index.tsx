import type { ComponentProps } from 'react';
import { cx } from '@/lib/ui/cx';
import styles from './Button.module.css';

/** The button styles. Only one `primary` should appear per view. */
type ButtonVariant = 'primary' | 'quiet' | 'danger' | 'outline';

/**
 * A text button: 30px in toolbars, or 36px with `large` in forms and dialogs.
 * @param props.variant - The button style. Defaults to quiet.
 * @param props.large - Uses the taller size for forms and dialogs.
 * @param props.className - Extra classes to add.
 * @param props.rest - Any other button attributes, passed to the element.
 * @returns The button element.
 */
export function Button({
  variant = 'quiet',
  large,
  className,
  ...props
}: ComponentProps<'button'> & { variant?: ButtonVariant; large?: boolean }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(styles.button, styles[variant], large && styles.large, className)}
    />
  );
}
