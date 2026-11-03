import { describe, expect, it } from 'vitest';
import { initials } from './names';

describe('initials', () => {
  it('takes first and last words', () => expect(initials('Mina van der Kato')).toBe('MK'));
  it('handles one word', () => expect(initials('mina')).toBe('M'));
  it('handles extra spaces', () => expect(initials('  a   b ')).toBe('AB'));
  it('does not split an emoji', () => expect(initials('🦊 Fox')).toBe('🦊F'));
});
