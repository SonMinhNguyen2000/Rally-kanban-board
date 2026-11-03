/**
 * Avatar initials from the first and last words. Spreading keeps an emoji in one piece.
 * @param name - The person's name.
 * @returns One or two uppercase initials.
 */
export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0] ? [...words[0]][0] : '';
  const last = words.length > 1 ? [...(words[words.length - 1] as string)][0] : '';
  return `${first ?? ''}${last ?? ''}`.toLocaleUpperCase();
}
