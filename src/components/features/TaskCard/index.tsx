import { ArrowDown, ArrowUp, FileText, MoreHorizontal, MessageSquare, Trash2 } from 'lucide-react';
import { useState, type HTMLAttributes } from 'react';
import { DueChip } from '@/components/features/DueChip';
import { AvatarStack } from '@/components/ui/AvatarStack';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LabelChip } from '@/components/ui/LabelChip';
import { cx } from '@/lib/ui/cx';
import type { Label } from '@/types/label';
import { PRIORITY_NAME, type Task } from '@/types/task';
import type { TeamMember } from '@/types/team';
import styles from './TaskCard.module.css';

/**
 * Props for a card. `lifted` is the copy carried under the pointer, `placeholder` is the slot
 * it left behind, and `rootProps` lets a wrapper add drag handlers to the root element.
 */
interface TaskCardProps {
  task: Task;
  members: TeamMember[];
  labels: Label[];
  selected?: boolean;
  lifted?: boolean;
  placeholder?: boolean;
  onDetails?: () => void;
  onDelete?: () => void;
  rootProps?: HTMLAttributes<HTMLDivElement> & Record<`data-${string}`, string>;
}

/**
 * A task on the board. Rows with nothing to show disappear, so a bare task is a single line.
 * @param props.task - The task to show.
 * @param props.members - The people assigned to the task.
 * @param props.labels - The labels on the task.
 * @param props.selected - Whether the task is open in the panel.
 * @param props.lifted - Whether this is the copy carried under the pointer.
 * @param props.placeholder - Whether this is the slot a carried card left behind.
 * @param props.onDetails - Opens the task from the card's menu.
 * @param props.onDelete - Deletes the task, once confirmed.
 * @param props.rootProps - Drag handlers and attributes for the card's root element.
 * @returns The card, with its actions menu and any open confirmation dialog.
 */
export function TaskCard({
  task,
  members,
  labels,
  selected,
  lifted,
  placeholder,
  onDetails,
  onDelete,
  rootProps,
}: TaskCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  // Normal priority has no marker, so it doesn't earn the meta row by itself.
  const hasMeta =
    task.priority !== 'normal' || Boolean(task.due_date) || task.comment_count > 0 || members.length > 0;

  // A carried card and its empty slot have nothing to act on.
  const hasMenu = Boolean(onDetails || onDelete) && !lifted && !placeholder;

  return (
    <div className={styles.frame}>
      <div
        {...rootProps}
        className={cx(
          styles.card,
          selected && styles.selected,
          lifted && styles.lifted,
          placeholder && styles.placeholder,
        )}
      >
      <div className={styles.content}>
        <h3 className={cx(styles.title, hasMenu && styles.titleWithMenu)}>{task.title}</h3>
        {labels.length > 0 && (
          <div className={styles.labels}>
            {labels.map((label) => (
              <LabelChip key={label.id} label={label} />
            ))}
          </div>
        )}
        {hasMeta && (
          <div className={styles.meta}>
            <div className={styles.facts}>
              {task.priority === 'high' && (
                <span className={styles.high}>
                  <ArrowUp size={12} aria-hidden="true" />
                  {PRIORITY_NAME.high}
                </span>
              )}
              {task.priority === 'low' && (
                <span className={styles.fact}>
                  <ArrowDown size={12} aria-hidden="true" />
                  {PRIORITY_NAME.low}
                </span>
              )}
              <DueChip task={task} />
              {task.comment_count > 0 && (
                <span
                  className={styles.fact}
                  aria-label={`${task.comment_count} ${task.comment_count === 1 ? 'comment' : 'comments'}`}
                >
                  <MessageSquare size={12} aria-hidden="true" />
                  <span data-tnum aria-hidden="true">
                    {task.comment_count}
                  </span>
                </span>
              )}
            </div>
            <AvatarStack members={members} />
          </div>
        )}
      </div>
      </div>
      {/* Beside the card rather than inside it, because the card is itself a button. */}
      {hasMenu && (
        <div className={styles.menu} onMouseLeave={() => setMenuOpen(false)}>
          <button
            type="button"
            className={styles.menuTrigger}
            aria-label={`Actions for ${task.title}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreHorizontal size={16} aria-hidden="true" />
          </button>
          {menuOpen && (
            <div className={styles.menuList} role="menu" aria-label={`Actions for ${task.title}`}>
              {onDetails && (
                <button
                  type="button"
                  role="menuitem"
                  className={styles.menuItem}
                  onClick={() => {
                    setMenuOpen(false);
                    onDetails();
                  }}
                >
                  <FileText size={14} aria-hidden="true" />
                  View details
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  role="menuitem"
                  className={cx(styles.menuItem, styles.deleteItem)}
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmDelete(true);
                  }}
                >
                  <Trash2 size={14} aria-hidden="true" />
                  Delete task
                </button>
              )}
            </div>
          )}
        </div>
      )}
      {confirmDelete && onDelete && (
        <ConfirmDialog
          title="Delete task?"
          body={`“${task.title}” will be removed from the board. This can’t be undone.`}
          confirm="Delete task"
          onConfirm={onDelete}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
