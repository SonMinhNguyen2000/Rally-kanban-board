import { Monitor, Moon, Palette, Plus, Sparkles, Sun, Tags, Users } from 'lucide-react';
import { BoardStats } from '@/components/features/BoardStats';
import { Button } from '@/components/ui/Button';
import { Picker } from '@/components/ui/Picker';
import { RallyLogo } from '@/components/ui/RallyLogo';
import { useTheme } from '@/lib/ui/useTheme';
import type { TaskView } from '@/types/filters';
import type { Task } from '@/types/task';
import type { ManageSection } from '@/components/features/ManageDialog';
import styles from './TopBar.module.css';

/** Props for the top bar. `primaryAction` is off when another button is the view's filled one. */
interface TopBarProps {
  tasks: Task[];
  view: TaskView;
  onViewChange: (view: TaskView) => void;
  connected: boolean;
  primaryAction: boolean;
  onNewTask: () => void;
  onManage: (section: ManageSection) => void;
}

/**
 * Product name, board stats, connection note, theme switch and the main actions.
 * @param props.tasks - All tasks on the board, which the stats are computed from.
 * @param props.view - The tasks the board is showing.
 * @param props.onViewChange - Receives the view to show.
 * @param props.connected - Whether live updates are connected. False shows a reconnecting note.
 * @param props.primaryAction - Whether New task is the view's filled button.
 * @param props.onNewTask - Opens the new task dialog.
 * @param props.onManage - Opens the team and labels dialog.
 * @returns The top bar header.
 */
export function TopBar({ tasks, view, onViewChange, connected, primaryAction, onNewTask, onManage }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const ThemeIcon = { system: Monitor, light: Sun, dark: Moon, glass: Sparkles, pastel: Palette }[theme];
  const themeOptions = [
    { value: 'system' as const, label: 'System', leading: <Monitor size={14} aria-hidden="true" /> },
    { value: 'light' as const, label: 'Light', leading: <Sun size={14} aria-hidden="true" /> },
    { value: 'dark' as const, label: 'Dark', leading: <Moon size={14} aria-hidden="true" /> },
    { value: 'glass' as const, label: 'Glass', leading: <Sparkles size={14} aria-hidden="true" /> },
    { value: 'pastel' as const, label: 'Pastel', leading: <Palette size={14} aria-hidden="true" /> },
  ];

  return (
    <header className={styles.topbar}>
      <div className={styles.brand}>
        <RallyLogo />
        <h1>Rally</h1>
      </div>
      <BoardStats tasks={tasks} view={view} onViewChange={onViewChange} className={styles.stats} />
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
        <Button onClick={() => onManage('members')} aria-label="Manage team">
          <Users size={16} aria-hidden="true" />
          <span className={styles.manageText}>Team</span>
        </Button>
        <Button onClick={() => onManage('labels')} aria-label="Manage labels">
          <Tags size={16} aria-hidden="true" />
          <span className={styles.manageText}>Labels</span>
        </Button>
        <Button variant={primaryAction ? 'primary' : 'outline'} onClick={onNewTask}>
          <Plus size={16} aria-hidden="true" />
          New task
        </Button>
      </div>
    </header>
  );
}
