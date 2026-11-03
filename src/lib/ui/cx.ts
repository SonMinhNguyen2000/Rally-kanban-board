/** 
 * Joins css class names for tailwindcss
 * skipping any that are switched off. 
 * @param names - The class names to join.
 * @returns The joined class names.
 */
export function cx(...names: (string | false | null | undefined)[]) {
  return names.filter(Boolean).join(' ');
}
