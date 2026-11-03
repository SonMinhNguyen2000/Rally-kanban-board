import { initials } from '@/lib/board/names';
import { cx } from '@/lib/ui/cx';
import { paletteVars } from '@/lib/ui/paletteVars';
import type { TeamMember } from '@/types/team';
import styles from './Avatar.module.css';

/**
 * A member's initials on their palette colour: 24px, or 28px with `large`.
 * @param props.member - The name and palette colour to show.
 * @param props.large - Uses the 28px size.
 * @returns The avatar element.
 */
export function Avatar({ member, large }: { member: Pick<TeamMember, 'name' | 'color'>; large?: boolean }) {
  return (
    <span
      className={cx(styles.avatar, large && styles.large)}
      style={paletteVars(member.color)}
      title={member.name}
      aria-label={member.name}
      role="img"
    >
      {initials(member.name)}
    </span>
  );
}
