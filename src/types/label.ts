import type { PaletteColor } from './palette';

/** A custom label. Names are unique per user, ignoring case. */
export interface Label {
  id: string;
  name: string;
  color: PaletteColor;
  created_at: string;
}
