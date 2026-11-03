import { Monitor, Moon, Plus, Sun, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { RallyLogo } from '@/components/ui/RallyLogo';
import { boardStats } from '@/lib/board/stats';
import { cx } from '@/lib/ui/cx';
import { useTheme } from '@/lib/ui/useTheme';
import type { Task } from '@/types/task';
import styles from './TopBar.module.css';

/** Props for the top bar. `primaryAction` is off when another button is the view's filled one. */
interface TopBarProps {
  tasks: Task[];
  connected: boolean;
  primaryAction: boolean;
  onNewTask: () => void;
  onManage: () => void;
}

/**
 * Product name, board stats, connection note, theme switch and the main actions.
 * @param props.tasks - All tasks on the board, which the stats are computed from.
 * @param props.connected - Whether live updates are connected. False shows a reconnecting note.
 * @param props.primaryAction - Whether New task is the view's filled button.
 * @param props.onNewTask - Opens the new task dialog.
 * @param props.onManage - Opens the team and labels dialog.
 * @returns The top bar header.
 */
export function TopBar({ tasks, connected, primaryAction, onNewTask, onManage }: TopBarProps) {
  const stats = boardStats(tasks);
  const { theme, setTheme } = useTheme();
  const ThemeIcon = theme === 'system' ? Monitor : theme === 'light' ? Sun : Moon;
  const themeOptions = [
    { value: 'system' as const, label: 'System', leading: <Monitor size={14} aria-hidden="true" /> },
    { value: 'light' as const, label: 'Light', leading: <Sun size={14} aria-hidden="true" /> },
    { value: 'dark' as const, label: 'Dark', leading: <Moon size={14} aria-hidden="true" /> },
  ];

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <RallyLogo />
        <h1>Rally</h1>
      </div>
      <dl className={styles.stats} aria-label="Board statistics">
        <div>
          <dd data-tnum>{stats.total}</dd>
          <dt>total</dt>
        </div>
        <div>
          <dd data-tnum>{stats.completed}</dd>
          <dt>completed</dt>
        </div>
        <div className={cx(stats.overdue > 0 && styles.overdue)}>
          <dd data-tnum>{stats.overdue}</dd>
          <dt>overdue</dt>
        </div>
      </dl>
      {!connected && (
        <span className={styles.offline} role="status">
          Reconnecting…
        </span>
      )}
      <div className={styles.actions}>
        <Picker
          label="Choose theme"
          options={themeOptions}
          selected={[theme]}
          onToggle={(value) => setTheme(value)}
          triggerClassName={styles.themePicker}
          triggerLabel={`Theme: ${theme}`}
          trigger={
            <>
              <ThemeIcon size={16} aria-hidden="true" />
              <span>{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
            </>
          }
        />
        <Button onClick={onManage} aria-label="Team and labels">
          <Users size={16} aria-hidden="true" />
          <span className={styles.manageText}>Team and labels</span>
        </Button>
        <Button variant={primaryAction ? 'primary' : 'outline'} onClick={onNewTask}>
          <Plus size={16} aria-hidden="true" />
          New task
        </Button>
      </div>
    </header>
  );
}
