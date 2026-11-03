/** Palette names for members and labels. Must match the *_color_palette constraints. */
export const PALETTE = [
  'rose',
  'rust',
  'ochre',
  'olive',
  'moss',
  'teal',
  'azure',
  'cobalt',
  'plum',
  'graphite',
] as const;
export type PaletteColor = (typeof PALETTE)[number];
