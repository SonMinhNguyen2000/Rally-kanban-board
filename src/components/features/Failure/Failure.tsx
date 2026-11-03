import { Button } from '@/components/ui/Button/Button';
import styles from './Failure.module.css';

/**
 * A full-page failure message, with a retry when trying again could help.
 * @param props.title - The heading.
 * @param props.body - What went wrong and what to do about it.
 * @param props.onRetry - Tries again. Without it, no button is shown.
 * @returns The failure message.
 */
export function Failure({ title, body, onRetry }: { title: string; body: string; onRetry?: () => void }) {
  return (
    <div className={styles.failure}>
      <div className={styles.body} role="alert">
        <h2>{title}</h2>
        <p>{body}</p>
        {onRetry && (
          <Button large variant="primary" onClick={onRetry}>
            Try again
          </Button>
        )}
      </div>
    </div>
  );
}
