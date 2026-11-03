import { Check, ChevronDown } from 'lucide-react';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/ui/cx';
import styles from './Picker.module.css';

/** One choice in a Picker. */
export interface PickerOption<T extends string> {
  value: T;
  label: string;
  leading?: ReactNode;
}

/** Props for Picker. */
interface PickerProps<T extends string> {
  /** Names the menu for assistive technology. */
  label: string;
  options: PickerOption<T>[];
  selected: T[];
  onToggle: (value: T, on: boolean) => void;
  multiple?: boolean;
  trigger: ReactNode;
  triggerClassName?: string;
  triggerLabel?: string;
  emptyText?: string;
  /** Sits under the options, for actions such as "Manage team". */
  footer?: (close: () => void) => ReactNode;
}

/**
 * A checkable menu. It renders in a portal so a scrolling panel can't clip it, and inside the
 * nearest <dialog> because anything outside a modal dialog is inert and hidden behind it.
 * @param props.label - Names the menu for assistive technology.
 * @param props.options - The choices to list.
 * @param props.selected - The values currently chosen.
 * @param props.onToggle - Called with a value and whether it is now on.
 * @param props.multiple - Allows several choices and keeps the menu open. Defaults to false.
 * @param props.trigger - The content of the button that opens the menu.
 * @param props.triggerClassName - Classes for that button.
 * @param props.triggerLabel - Accessible name for that button, when its content is not enough.
 * @param props.emptyText - Shown when there are no options.
 * @param props.footer - Renders actions under the options, and receives a function that closes the menu.
 * @returns The trigger button, and the menu while it is open.
 */
export function Picker<T extends string>({
  label,
  options,
  selected,
  onToggle,
  multiple = false,
  trigger,
  triggerClassName,
  triggerLabel,
  emptyText = 'Nothing to choose yet',
  footer,
}: PickerProps<T>) {
  const [open, setOpen] = useState(false);
  // Null until measured. The menu renders hidden first, because placing it needs its size.
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    placement: 'below' | 'above';
  } | null>(null);
  const isPlaced = position !== null; // Stays true through later moves, so they can't steal focus.
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const id = useId();

  /**
   * Closes the menu, returning focus to the trigger unless the user has moved on.
   * @param returnFocus - Whether focus goes back to the trigger. Defaults to true.
   */
  const close = (returnFocus = true) => {
    setOpen(false);
    setPosition(null);
    if (returnFocus) triggerRef.current?.focus();
  };

  useLayoutEffect(() => {
    if (!open) return;

    /** Places the menu under the trigger, or above it when there's no room, kept on screen. */
    const place = () => {
      const anchor = triggerRef.current?.getBoundingClientRect();
      const menu = menuRef.current;
      if (!anchor || !menu) return;
      const margin = 8; // Minimum distance from the viewport's edge.
      const below = anchor.bottom + 4;
      const fitsBelow = below + menu.offsetHeight <= window.innerHeight - margin;
      setPosition({
        top: fitsBelow ? below : Math.max(margin, anchor.top - menu.offsetHeight - 4),
        left: Math.max(margin, Math.min(anchor.left, window.innerWidth - menu.offsetWidth - margin)),
        placement: fitsBelow ? 'below' : 'above',
      });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open]);

  // Waits for placement, because focus() silently fails while the menu is visibility: hidden.
  useEffect(() => {
    if (open && isPlaced) menuRef.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus();
  }, [open, isPlaced]);

  useEffect(() => {
    if (!open) return;

    /**
     * Closes on a press anywhere outside, leaving focus where the press put it.
     * @param event - The pointer press.
     */
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close(false);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
    // close only touches refs and state setters, so it doesn't need to be a dependency.
  }, [open]);

  /**
   * Arrow keys, Home and End move through the items. Escape and Tab close the menu.
   * @param event - The key press inside the menu.
   */
  const onKeyDown = (event: KeyboardEvent) => {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);

    /**
     * Focuses an item by index, wrapping at both ends.
     * @param next - The index to focus, which may fall outside the list.
     */
    const focusAt = (next: number) => {
      event.preventDefault();
      items[(next + items.length) % items.length]?.focus();
    };

    if (event.key === 'Escape') {
      event.preventDefault(); // Keeps the surrounding panel or dialog open.
      event.stopPropagation();
      close();
    } else if (event.key === 'ArrowDown') focusAt(index + 1);
    else if (event.key === 'ArrowUp') focusAt(index - 1);
    else if (event.key === 'Home') focusAt(0);
    else if (event.key === 'End') focusAt(items.length - 1);
    else if (event.key === 'Tab') close(false);
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={triggerLabel}
        onClick={() => (open ? close() : setOpen(true))}
      >
        <span className={styles.triggerContent}>{trigger}</span>
        <ChevronDown size={14} aria-hidden="true" className={styles.triggerCaret} />
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={id}
            role="menu"
            aria-label={label}
            className={styles.menu}
            data-placement={position?.placement}
            style={position ? { top: position.top, left: position.left } : { visibility: 'hidden', top: 0, left: 0 }}
            onKeyDown={onKeyDown}
          >
            {options.length === 0 && <p className={styles.empty}>{emptyText}</p>}
            {options.map((option) => {
              const isOn = selected.includes(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  role={multiple ? 'menuitemcheckbox' : 'menuitemradio'}
                  aria-checked={isOn}
                  className={styles.item}
                  onClick={() => {
                    onToggle(option.value, !isOn);
                    if (!multiple) close();
                  }}
                >
                  {option.leading}
                  <span className={styles.itemLabel}>{option.label}</span>
                  <Check size={14} aria-hidden="true" className={cx(styles.check, isOn && styles.checkOn)} />
                </button>
              );
            })}
            {footer && <div className={styles.footer}>{footer(() => close(false))}</div>}
          </div>,
          // Evaluated only while open, which never happens during server rendering.
          triggerRef.current?.closest('dialog') ?? document.body,
        )}
    </>
  );
}
