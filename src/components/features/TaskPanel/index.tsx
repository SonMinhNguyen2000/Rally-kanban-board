import { Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { ManageSection } from '@/components/features/ManageDialog';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton';
import { LabelChip } from '@/components/ui/LabelChip';
import { Picker } from '@/components/ui/Picker';
import { StatusMark } from '@/components/ui/StatusMark';
import { Swatch } from '@/components/ui/Swatch';
import { CommentBox } from '@/components/features/CommentBox';
import { DueChip } from '@/components/features/DueChip';
import { Timeline } from '@/components/features/Timeline';
import { dueState } from '@/lib/board/dates';
import type { TaskActions } from '@/lib/data/useTaskActions';
import { cx } from '@/lib/ui/cx';
import { useAutoGrow } from '@/lib/ui/useAutoGrow';
import { useDraft } from '@/lib/ui/useDraft';
import type { Label } from '@/types/label';
import {
  LANE,
  PRIORITIES,
  PRIORITY_NAME,
  STATUSES,
  type Priority,
  type Status,
  type Task,
} from '@/types/task';
import type { TeamMember } from '@/types/team';
import styles from './TaskPanel.module.css';

/** Longest the exit can take, in case animationend never fires. Above --dur-panel-out. */
const CLOSE_FALLBACK_MS = 300;

/** Props for the panel. While `closing` it plays its exit, then calls `onClosed` to be unmounted. */
interface TaskPanelProps {
  uid: string;
  task: Task;
  members: TeamMember[];
  labels: Label[];
  actions: TaskActions;
  closing: boolean;
  onClose: () => void;
  onClosed: () => void;
  onManage: (section: ManageSection) => void;
}

/**
 * The task detail drawer: inline title and description, properties, timeline and comment box.
 * The board stays usable behind it on wide screens, so it isn't a modal dialog.
 * @param props.uid - The signed-in guest, which scopes comment writes and cache updates.
 * @param props.task - The task to show.
 * @param props.members - The people who can be assigned.
 * @param props.labels - The labels that can be attached.
 * @param props.actions - Saves changes to the task.
 * @param props.closing - Whether the panel is playing its exit.
 * @param props.onClose - Starts closing the panel.
 * @param props.onClosed - Called when the exit has finished, so the panel can be unmounted.
 * @param props.onManage - Opens the team and labels dialog.
 * @returns The panel, plus the delete confirmation while it's open.
 */
export function TaskPanel({ uid, task, members, labels, actions, closing, onClose, onClosed, onManage }: TaskPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null); // Receives focus when a task opens.
  const title = useDraft(task.title);
  const description = useDraft(task.description ?? '');
  const titleRef = useAutoGrow(title.draft);
  const descriptionRef = useAutoGrow(description.draft);
  const [titleError, setTitleError] = useState(false);

  useEffect(() => {
    if (closing) return; // Focus is on its way back to the card.
    setTitleError(false);
    closeRef.current?.focus();
  }, [task.id, closing]);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(onClosed, CLOSE_FALLBACK_MS);
    return () => clearTimeout(timer);
  }, [closing, onClosed]);

  useEffect(() => {
    /**
     * Closes on Escape, unless a menu or dialog on top of the panel is handling it.
     * @param event - The key press on the document.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('dialog[open]')) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  /** Saves the title on blur. A blank title is refused and the previous one restored. */
  const saveTitle = () => {
    title.setFocused(false);
    const next = title.draft.trim();
    if (!next) {
      setTitleError(true);
      title.setDraft(task.title);
      return;
    }
    setTitleError(false);
    if (next !== task.title) actions.patch({ id: task.id, patch: { title: next } });
  };

  /** Saves the description on blur. Clearing the text stores null. */
  const saveDescription = () => {
    description.setFocused(false);
    const next = description.draft.trim() || null;
    if (next !== task.description) actions.patch({ id: task.id, patch: { description: next } });
  };

  // Ids resolved to rows. An id can outlive its row briefly while a delete syncs.
  const assigned = task.assignee_ids.flatMap((id) => members.find((m) => m.id === id) ?? []);
  const attached = task.label_ids.flatMap((id) => labels.find((l) => l.id === id) ?? []);

  return (
    <aside
      className={cx(styles.panel, closing && styles.closing)}
      aria-label={`Task: ${task.title}`}
      inert={closing}
      onAnimationEnd={(event) => {
        // Child animations bubble here too, so only the panel's own exit counts.
        if (closing && event.target === event.currentTarget) onClosed();
      }}
    >
      <header className={styles.head}>
        <Picker<Status>
          label="Status"
          options={STATUSES.map((status) => ({
            value: status,
            label: LANE[status].name,
            leading: <StatusMark status={status} />,
          }))}
          selected={[task.status]}
          onToggle={(status) => {
            if (status !== task.status) actions.patch({ id: task.id, patch: { status } });
          }}
          triggerClassName={styles.statusTrigger}
          trigger={
            <>
              <StatusMark status={task.status} />
              {LANE[task.status].name}
            </>
          }
          triggerLabel={`Status: ${LANE[task.status].name}. Change status`}
        />
        <div className={styles.headActions}>
          <IconButton label="Delete task" onClick={() => setConfirmDelete(true)}>
            <Trash2 size={16} aria-hidden="true" />
          </IconButton>
          <IconButton ref={closeRef} label="Close panel" onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </IconButton>
        </div>
      </header>

      <div className={styles.scroll}>
        <label className="sr-only" htmlFor="panel-title">
          Title
        </label>
        <textarea
          id="panel-title"
          ref={titleRef}
          rows={1}
          maxLength={200}
          className={styles.title}
          value={title.draft}
          aria-invalid={titleError}
          onFocus={() => title.setFocused(true)}
          onChange={(event) => title.setDraft(event.target.value)}
          onBlur={saveTitle}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              event.currentTarget.blur();
            }
          }}
        />
        {titleError && (
          <p className={styles.error} role="alert">
            A task needs a title, so the previous one was kept.
          </p>
        )}

        <label className="sr-only" htmlFor="panel-description">
          Description
        </label>
        <textarea
          id="panel-description"
          ref={descriptionRef}
          rows={2}
          maxLength={10000}
          className={styles.description}
          placeholder="Add a description"
          value={description.draft}
          onFocus={() => description.setFocused(true)}
          onChange={(event) => description.setDraft(event.target.value)}
          onBlur={saveDescription}
        />

        <dl className={styles.props}>
          <dt>Priority</dt>
          <dd>
            <Picker<Priority>
              label="Priority"
              options={PRIORITIES.map((priority) => ({ value: priority, label: PRIORITY_NAME[priority] }))}
              selected={[task.priority]}
              onToggle={(priority) => {
                if (priority !== task.priority) actions.patch({ id: task.id, patch: { priority } });
              }}
              triggerClassName={styles.propTrigger}
              trigger={PRIORITY_NAME[task.priority]}
              triggerLabel={`Priority: ${PRIORITY_NAME[task.priority]}. Change priority`}
            />
          </dd>

          <dt>
            <label htmlFor="panel-due">Due date</label>
          </dt>
          <dd className={styles.dueRow}>
            <input
              id="panel-due"
              type="date"
              className={styles.date}
              value={task.due_date ?? ''}
              onChange={(event) => actions.patch({ id: task.id, patch: { due_date: event.target.value || null } })}
            />
            {/* A plain date would only repeat the field beside it. */}
            {['soon', 'overdue'].includes(dueState(task)) && <DueChip task={task} />}
          </dd>

          <dt>Assignees</dt>
          <dd>
            <Picker
              label="Assignees"
              multiple
              options={members.map((member) => ({
                value: member.id,
                label: member.name,
                leading: <Avatar member={member} />,
              }))}
              selected={task.assignee_ids}
              onToggle={(memberId, on) => actions.setAssignee({ taskId: task.id, memberId, on })}
              triggerClassName={styles.propTrigger}
              emptyText="No team members yet"
              footer={(close) => (
                <Button
                  onClick={() => {
                    close();
                    onManage('members');
                  }}
                >
                  Manage team
                </Button>
              )}
              trigger={
                assigned.length > 0 ? (
                  <span className={styles.people}>
                    {assigned.map((member) => (
                      <span key={member.id} className={styles.person}>
                        <Avatar member={member} />
                        <span>{member.name}</span>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className={styles.none}>Add assignee</span>
                )
              }
              triggerLabel={
                assigned.length > 0
                  ? `Assigned to ${assigned.map((m) => m.name).join(', ')}. Change assignees`
                  : 'Add assignee'
              }
            />
          </dd>

          <dt>Labels</dt>
          <dd>
            <Picker
              label="Labels"
              multiple
              options={labels.map((label) => ({
                value: label.id,
                label: label.name,
                leading: <Swatch color={label.color} />,
              }))}
              selected={task.label_ids}
              onToggle={(labelId, on) => actions.setLabel({ taskId: task.id, labelId, on })}
              triggerClassName={styles.propTrigger}
              emptyText="No labels yet"
              footer={(close) => (
                <Button
                  onClick={() => {
                    close();
                    onManage('labels');
                  }}
                >
                  Manage labels
                </Button>
              )}
              trigger={
                attached.length > 0 ? (
                  <span className={styles.people}>
                    {attached.map((label) => (
                      <LabelChip key={label.id} label={label} />
                    ))}
                  </span>
                ) : (
                  <span className={styles.none}>Add label</span>
                )
              }
              triggerLabel={
                attached.length > 0
                  ? `Labels: ${attached.map((l) => l.name).join(', ')}. Change labels`
                  : 'Add label'
              }
            />
          </dd>
        </dl>

        <Timeline uid={uid} taskId={task.id} />
      </div>

      <CommentBox uid={uid} taskId={task.id} />

      {confirmDelete && (
        <ConfirmDialog
          title="Delete this task?"
          body={`“${task.title}” and its comments and history will be permanently removed.`}
          confirm="Delete task"
          onConfirm={() => {
            actions.remove({ id: task.id });
            onClose();
          }}
          onClose={() => setConfirmDelete(false)}
        />
      )}
    </aside>
  );
}
