import { AddRow } from '@/components/features/AddRow/AddRow';
import { ManageRow } from '@/components/features/ManageRow/ManageRow';
import { Dialog } from '@/components/ui/Dialog/Dialog';
import type { LabelActions } from '@/lib/data/useLabelActions';
import type { MemberActions } from '@/lib/data/useMemberActions';
import { PALETTE, type PaletteColor } from '@/types/palette';
import type { Label } from '@/types/label';
import type { TeamMember } from '@/types/team';
import styles from './ManageDialog.module.css';

/**
 * Suggests the next palette colour, so a list of new items doesn't start out all one colour.
 * @param count - How far to step through the palette, wrapping at its end.
 * @returns The palette colour for the next new item.
 */
const nextColor = (count: number): PaletteColor => PALETTE[count % PALETTE.length] as PaletteColor;

/**
 * Where people and labels are added, renamed, recoloured and deleted.
 * @param props.members - The team members to list.
 * @param props.labels - The labels to list.
 * @param props.memberActions - Creates, updates and removes members.
 * @param props.labelActions - Creates, updates and removes labels.
 * @param props.onClose - Closes the dialog.
 * @returns The dialog, with a team section and a labels section.
 */
export function ManageDialog({
  members,
  labels,
  memberActions,
  labelActions,
  onClose,
}: {
  members: TeamMember[];
  labels: Label[];
  memberActions: MemberActions;
  labelActions: LabelActions;
  onClose: () => void;
}) {
  return (
    <Dialog title="Team and labels" onClose={onClose}>
      <section className={styles.section} aria-labelledby="manage-team">
        <h3 id="manage-team">Team</h3>
        {members.length === 0 && <p className={styles.hint}>Add the people you assign work to.</p>}
        <ul className={styles.rows}>
          {members.map((member) => (
            <ManageRow
              key={member.id}
              item={member}
              noun="Member"
              impact="They’ll be removed from every task they’re assigned to. Task history keeps their name."
              onRename={(name) => memberActions.update({ id: member.id, patch: { name } })}
              onColor={(color) => memberActions.update({ id: member.id, patch: { color } })}
              onDelete={() => memberActions.remove({ id: member.id })}
            />
          ))}
        </ul>
        <AddRow
          noun="Member"
          placeholder="Add a person"
          maxLength={80}
          nextColor={nextColor(members.length)}
          onAdd={memberActions.create}
        />
      </section>

      <section className={styles.section} aria-labelledby="manage-labels">
        <h3 id="manage-labels">Labels</h3>
        {labels.length === 0 && <p className={styles.hint}>Labels group related work and can be used as filters.</p>}
        <ul className={styles.rows}>
          {labels.map((label) => (
            <ManageRow
              key={label.id}
              item={label}
              noun="Label"
              impact="It’ll be removed from every task that has it. Task history keeps its name."
              onRename={(name) => labelActions.update({ id: label.id, patch: { name } })}
              onColor={(color) => labelActions.update({ id: label.id, patch: { color } })}
              onDelete={() => labelActions.remove({ id: label.id })}
            />
          ))}
        </ul>
        <AddRow
          noun="Label"
          placeholder="Add a label"
          maxLength={50}
          nextColor={nextColor(labels.length + 5)}
          onAdd={labelActions.create}
        />
      </section>
    </Dialog>
  );
}
