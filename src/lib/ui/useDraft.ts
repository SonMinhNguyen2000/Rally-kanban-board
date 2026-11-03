import { useEffect, useState } from 'react';

/** 
 * A local draft of an inline field. (e.g. a title or description)
 * 
 * @param value - The initial value of the field.
 * @returns An object with the draft, a function to update the draft, and a function to set the focus state.
 */
export function useDraft(value: string) {
  const [draft, setDraft] = useState(value);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    if (!focused) setDraft(value);
  }, [value, focused]);
  return { draft, setDraft, setFocused };
}
