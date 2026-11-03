import { useId, useState, type FormEvent } from 'react';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { Dialog } from '@/components/ui/Dialog/Dialog';
import { FieldError } from '@/components/ui/FieldError/FieldError';
import { LabelChip } from '@/components/ui/LabelChip/LabelChip';
import { Picker } from '@/components/ui/Picker/Picker';
import { StatusMark } from '@/components/ui/StatusMark/StatusMark';
import { Swatch } from '@/components/ui/Swatch/Swatch';
import { TextArea } from '@/components/ui/TextArea/TextArea';
import { TextInput } from '@/components/ui/TextInput/TextInput';
import type { TaskActions } from '@/lib/data/useTaskActions';
import { friendlyError } from '@/lib/errors';
import type { Label } from '@/types/label';
import { LANE, PRIORITIES, PRIORITY_NAME, STATUSES, type Priority, type Status } from '@/types/task';
import type { TeamMember } from '@/types/team';
import styles from './NewTaskDialog.module.css';

/**
 * The create-task form. It stays open with its text until the task has really saved.
 * @param props.initialStatus - The lane the new task starts in.
 * @param props.members - The people who can be assigned.
 * @param props.labels - The labels that can be attached.
 * @param props.createTask - Saves the task.
 * @param props.onClose - Closes the dialog.
 * @returns The dialog containing the form.
 */
export function NewTaskDialog({
  initialStatus,
  members,
  labels,
  createTask,
  onClose,
}: {
  initialStatus: Status;
  members: TeamMember[];
  labels: Label[];
  createTask: TaskActions['create'];
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>(initialStatus);
  const [priority, setPriority] = useState<Priority>('normal');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const formId = useId(); // Links the footer's submit button to the form, and labels to fields.

  /**
   * Validates the title, then creates the task, showing any failure inside the dialog.
   * @param event - The form's submit event.
   */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;
    const trimmed = title.trim();
    if (!trimmed) {
      setTitleError('Add a title so this task can be found later.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await createTask({
        id: crypto.randomUUID(),
        title: trimmed,
        description: description.trim() || null,
        status,
        priority,
        due_date: dueDate || null,
        assignee_ids: assigneeIds,
        label_ids: labelIds,
      });
      onClose();
    } catch (error) {
      setSaveError(friendlyError(error, 'Couldn’t create the task. Your text is still here, so try again.'));
      setSaving(false);
    }
  };

  /**
   * Adds an id to a chosen list or removes it.
   * @param list - The ids chosen so far.
   * @param set - Stores the updated list.
   * @param value - The id to add or remove.
   * @param on - True to add the id, false to remove it.
   */
  const toggle = (list: string[], set: (next: string[]) => void, value: string, on: boolean) =>
    set(on ? [...list, value] : list.filter((item) => item !== value));

  // The chosen rows, for showing in the picker triggers.
  const chosenMembers = assigneeIds.flatMap((id) => members.find((m) => m.id === id) ?? []);
  const chosenLabels = labelIds.flatMap((id) => labels.find((l) => l.id === id) ?? []);

  return (
    <Dialog
      title="New task"
      onClose={onClose}
      footer={
        <>
          <Button large onClick={onClose}>
            Cancel
          </Button>
          <Button large variant="primary" type="submit" form={formId} disabled={saving}>
            {saving ? 'Creating…' : 'Create task'}
          </Button>
        </>
      }
    >
      <form id={formId} className={styles.form} onSubmit={(event) => void submit(event)} noValidate>
        <div className={styles.field}>
          <label htmlFor={`${formId}-title`}>Title</label>
          <TextInput
            id={`${formId}-title`}
            value={title}
            maxLength={200}
            data-autofocus
            required
            aria-invalid={Boolean(titleError)}
            aria-describedby={titleError ? `${formId}-title-error` : undefined}
            onChange={(event) => {
              setTitle(event.target.value);
              setTitleError(null);
            }}
          />
          {titleError && <FieldError id={`${formId}-title-error`}>{titleError}</FieldError>}
        </div>

        <div className={styles.field}>
          <label htmlFor={`${formId}-description`}>
            Description <span className={styles.optional}>optional</span>
          </label>
          <TextArea
            id={`${formId}-description`}
            rows={3}
            maxLength={10000}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Status</span>
            <Picker<Status>
              label="Status"
              options={STATUSES.map((value) => ({
                value,
                label: LANE[value].name,
                leading: <StatusMark status={value} />,
              }))}
              selected={[status]}
              onToggle={(value) => setStatus(value)}
              triggerClassName={styles.select}
              triggerLabel={`Status: ${LANE[status].name}`}
              trigger={
                <>
                  <StatusMark status={status} />
                  {LANE[status].name}
                </>
              }
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Priority</span>
            <Picker<Priority>
              label="Priority"
              options={PRIORITIES.map((value) => ({ value, label: PRIORITY_NAME[value] }))}
              selected={[priority]}
              onToggle={(value) => setPriority(value)}
              triggerClassName={styles.select}
              triggerLabel={`Priority: ${PRIORITY_NAME[priority]}`}
              trigger={PRIORITY_NAME[priority]}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor={`${formId}-due`}>
              Due date <span className={styles.optional}>optional</span>
            </label>
            <TextInput
              id={`${formId}-due`}
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </div>
          <div className={styles.field}>
            <span className={styles.fieldLabel}>Assignees</span>
            <Picker
              label="Assignees"
              multiple
              options={members.map((member) => ({
                value: member.id,
                label: member.name,
                leading: <Avatar member={member} />,
              }))}
              selected={assigneeIds}
              onToggle={(value, on) => toggle(assigneeIds, setAssigneeIds, value, on)}
              triggerClassName={styles.select}
              emptyText="Add people under Team and labels"
              triggerLabel="Assignees"
              trigger={
                chosenMembers.length > 0 ? (
                  <span className={styles.selectText}>{chosenMembers.map((m) => m.name).join(', ')}</span>
                ) : (
                  <span className={styles.optional}>None</span>
                )
              }
            />
          </div>
        </div>

        <div className={styles.field}>
          <span className={styles.fieldLabel}>Labels</span>
          <Picker
            label="Labels"
            multiple
            options={labels.map((label) => ({
              value: label.id,
              label: label.name,
              leading: <Swatch color={label.color} />,
            }))}
            selected={labelIds}
            onToggle={(value, on) => toggle(labelIds, setLabelIds, value, on)}
            triggerClassName={styles.select}
            emptyText="Add labels under Team and labels"
            triggerLabel="Labels"
            trigger={
              chosenLabels.length > 0 ? (
                <span className={styles.chips}>
                  {chosenLabels.map((label) => (
                    <LabelChip key={label.id} label={label} />
                  ))}
                </span>
              ) : (
                <span className={styles.optional}>None</span>
              )
            }
          />
        </div>

        {saveError && (
          <p className={styles.formError} role="alert">
            {saveError}
          </p>
        )}
      </form>
    </Dialog>
  );
}
