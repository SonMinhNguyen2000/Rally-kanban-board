import type { CSSProperties } from 'react';
import type { PaletteColor } from '@/types/palette';

/** 
 * Points a component's 
 * --tint, --ink, --solid and --on 
 * at one palette entry from tokens.css.
 * @param color - The palette color to use.
 * @returns The CSS properties for the palette variables.
 */
export function paletteVars(color: PaletteColor) {
  return {
    '--tint': `var(--c-${color}-tint)`,
    '--ink': `var(--c-${color}-ink)`,
    '--solid': `var(--c-${color}-solid)`,
    '--on': `var(--c-${color}-on)`,
  } as CSSProperties;
}
