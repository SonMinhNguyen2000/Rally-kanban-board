import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import styles from './ConfirmDialog.module.css';

/**
 * Asks before a destructive action. `confirm` names the action on the danger button.
 * @param props.title - The question in the heading.
 * @param props.body - What will happen, in a sentence.
 * @param props.confirm - The label on the danger button.
 * @param props.onConfirm - Runs the action when confirmed.
 * @param props.onClose - Called when the dialog closes, whether confirmed or cancelled.
 * @returns The confirmation dialog.
 */
export function ConfirmDialog({
  title,
  body,
  confirm,
  onConfirm,
  onClose,
}: {
  title: string;
  body: string;
  confirm: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button large onClick={onClose}>
            Cancel
          </Button>
          <Button
            large
            variant="danger"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirm}
          </Button>
        </>
      }
    >
      <p className={styles.body}>{body}</p>
    </Dialog>
  );
}
