import { useSyncExternalStore } from 'react';

/** One message in the toast stack. 
 * @property id - The ID of the toast.
 * @property message - The message to display.
 * @property tone - The tone of the toast.
*/
export interface Toast {
  id: number;
  message: string;
  tone: 'neutral' | 'danger';
}

// A small store outside React, so mutation callbacks can raise a toast from anywhere.
let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

// The server has no toasts. A stable reference stops React re-rendering on hydration.
const NO_TOASTS: Toast[] = [];

/** Tells subscribed components that the stack changed. */
function emit() {
  for (const listener of listeners) listener();
}

/** 
 * Removes a toast. 
 * 
 * @param id - The ID of the toast to remove.
 */
export function dismissToast(id: number) {
  toasts = toasts.filter((toast) => toast.id !== id);
  emit();
}

/** 
 * Shows a toast
 * @param message - The message to display.
 * @param tone - The tone of the toast.
 */
export function showToast(
  message: string, 
  tone: Toast['tone'] = 'neutral'
) {
  // Stop showing duplicate messages.
  if (toasts.some((toast) => toast.message === message)) return;
  const id = nextId++;
  toasts = [...toasts.slice(-2), { id, message, tone }];
  emit();
  setTimeout(() => dismissToast(id), tone === 'danger' ? 7000 : 4000);
}

/**
 * The current toast stack.
 * @returns The toasts currently showing.
 */
export function useToasts(): Toast[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => toasts,
    () => NO_TOASTS,
  );
}
