import type { PaletteColor } from './palette';

/** A person tasks can be assigned to. */
export interface TeamMember {
  id: string;
  name: string;
  color: PaletteColor;
  created_at: string;
}
