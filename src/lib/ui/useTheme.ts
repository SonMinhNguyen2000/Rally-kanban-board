import { useContext } from 'react';
import { ThemeContext } from '@/components/features/AppProviders';

/** The user's theme choice. `system` follows the operating system. */
export type ThemeChoice = 'system' | 'light' | 'dark';

/** 
 * The current theme and an explicit theme selection function.
 * @returns The current theme and a function for selecting a theme.
 */
export function useTheme() {
  return useContext(ThemeContext);
}
