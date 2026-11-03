import { useLayoutEffect, useRef } from 'react';

/** 
 * Returns a ref for a textarea that grows to fit its text. 
 * @param value - The value of the textarea.
 * @returns ref for the textarea.
 */
export function useAutoGrow(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = 'auto'; // Lets it shrink as well as grow.
    element.style.height = `${element.scrollHeight}px`;
  }, [value]);
  return ref;
}
