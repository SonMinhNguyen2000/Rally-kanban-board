import { paletteVars } from '@/lib/ui/paletteVars';
import type { PaletteColor } from '@/types/palette';
import styles from './Swatch.module.css';

/**
 * A small square of a palette colour. Decorative, so its name must appear nearby.
 * @param props.color - The palette colour to show.
 * @returns The swatch element.
 */
export function Swatch({ color }: { color: PaletteColor }) {
  return <span className={styles.swatch} style={paletteVars(color)} aria-hidden="true" />;
}
