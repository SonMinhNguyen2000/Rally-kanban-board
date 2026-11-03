import { Avatar } from '@/components/ui/Avatar/Avatar';
import type { TeamMember } from '@/types/team';
import styles from './AvatarStack.module.css';

/**
 * Side-by-side avatars that collapse to "+N" past `limit`. Renders nothing with no members.
 * @param props.members - The people to show, in order.
 * @param props.limit - How many avatars to show before collapsing. Defaults to 3.
 * @returns The stack, or null when there are no members.
 */
export function AvatarStack({ members, limit = 3 }: { members: TeamMember[]; limit?: number }) {
  if (members.length === 0) return null;
  const shown = members.slice(0, limit);
  const extra = members.length - shown.length; // How many the "+N" stands for.
  return (
    <span className={styles.stack}>
      {shown.map((member) => (
        <Avatar key={member.id} member={member} />
      ))}
      {extra > 0 && (
        <span className={styles.more} title={members.slice(limit).map((m) => m.name).join(', ')}>
          +{extra}
        </span>
      )}
    </span>
  );
}
