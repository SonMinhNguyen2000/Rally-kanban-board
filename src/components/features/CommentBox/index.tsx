import { CornerDownLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useCommentActions } from '@/lib/data/timeline';
import { useAutoGrow } from '@/lib/ui/useAutoGrow';
import styles from './CommentBox.module.css';

/**
 * The comment form pinned to the bottom of the panel. Text stays in place if posting fails.
 * @param props.uid - The signed-in guest's user id.
 * @param props.taskId - The task being commented on.
 * @returns The comment form.
 */
export function CommentBox({ uid, taskId }: { uid: string; taskId: string }) {
  const [body, setBody] = useState('');
  const { add } = useCommentActions(uid, taskId);
  const ref = useAutoGrow(body);
  const canSend = body.trim() !== '' && !add.isPending; // Blocks blank comments and double posts.

  // A draft belongs to its task, and the panel stays mounted when switching tasks.
  useEffect(() => setBody(''), [taskId]);

  /** Posts the comment, clearing the box only once it has saved. */
  const send = () => {
    if (!canSend) return;
    add.mutate(body.trim(), { onSuccess: () => setBody('') });
  };

  return (
    <form
      className={styles.commentBox}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      <label className="sr-only" htmlFor="panel-comment">
        Add a comment
      </label>
      <textarea
        id="panel-comment"
        ref={ref}
        rows={1}
        maxLength={5000}
        placeholder="Add a comment"
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            send();
          }
        }}
      />
      <Button type="submit" variant="outline" disabled={!canSend} title="Ctrl or Cmd + Enter">
        <CornerDownLeft size={14} aria-hidden="true" />
        {add.isPending ? 'Posting…' : 'Comment'}
      </Button>
    </form>
  );
}
