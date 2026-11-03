import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Board } from '@/components/features/Board';
import { BoardNotice } from '@/components/features/BoardNotice';
import { BoardSkeleton } from '@/components/features/BoardSkeleton';
import { Failure } from '@/components/features/Failure';
import { FilterBar } from '@/components/features/FilterBar';
import { ManageDialog, type ManageSection } from '@/components/features/ManageDialog';
import { NewTaskDialog } from '@/components/features/NewTaskDialog';
import { TaskPanel } from '@/components/features/TaskPanel';
import { TopBar } from '@/components/features/TopBar';
import { Button } from '@/components/ui/Button';
import { Toaster } from '@/components/ui/Toaster';
import { filterTasks, hasFilters } from '@/lib/board/filters';
import { useBoard } from '@/lib/data/boardQuery';
import { useRealtimeSync } from '@/lib/data/realtime';
import { useLabelActions } from '@/lib/data/useLabelActions';
import { useMemberActions } from '@/lib/data/useMemberActions';
import { useSampleBoard } from '@/lib/data/useSampleBoard';
import { useTaskActions } from '@/lib/data/useTaskActions';
import { cx } from '@/lib/ui/cx';
import { useMediaQuery } from '@/lib/ui/useMediaQuery';
import { NO_FILTERS, type Filters } from '@/types/filters';
import type { Status } from '@/types/task';
import styles from './BoardScreen.module.css';

/**
 * The signed-in screen: top bar, filters, board, task panel and dialogs.
 * @param props.uid - The signed-in guest's user id.
 * @returns The screen, its loading skeleton, or a failure message.
 */
export function BoardScreen({ uid }: { uid: string }) {
  const board = useBoard(uid);
  const taskActions = useTaskActions(uid);
  const memberActions = useMemberActions(uid);
  const labelActions = useLabelActions(uid);
  const sampleBoard = useSampleBoard(uid);
  const connected = useRealtimeSync(uid);

  const [filters, setFilters] = useState<Filters>(NO_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false); // The panel is playing its exit, with selectedId kept until it ends.
  const [newTaskStatus, setNewTaskStatus] = useState<Status | null>(null);
  const [managing, setManaging] = useState<ManageSection | null>(null);
  const isWide = useMediaQuery('(min-width: 1100px)'); // Wide screens keep the board usable behind the panel.

  const lastCardRef = useRef<string | null>(null); // The card to return focus to when the panel closes.

  /**
   * Opens a task in the panel, cancelling any exit that's still playing.
   * @param id - The task to open.
   */
  const selectTask = useCallback((id: string) => {
    lastCardRef.current = id;
    setSelectedId(id);
    setClosing(false);
  }, []);

  /** Starts the panel's exit and returns focus to its card, for anyone not using a pointer. */
  const closePanel = useCallback(() => {
    setClosing(true);
    const id = lastCardRef.current;
    requestAnimationFrame(() => {
      if (id) document.querySelector<HTMLElement>(`[data-task-id="${id}"]`)?.focus({ preventScroll: true });
    });
  }, []);

  /** Unmounts the panel once its exit has finished. */
  const finishClosing = useCallback(() => {
    setSelectedId(null);
    setClosing(false);
  }, []);

  const tasks = board.data?.tasks;
  const visible = useMemo(() => (tasks ? filterTasks(tasks, filters) : []), [tasks, filters]);
  const selected = tasks?.find((task) => task.id === selectedId);

  // Another tab may delete the open task.
  useEffect(() => {
    if (selectedId && tasks && !selected) finishClosing();
  }, [selectedId, selected, tasks, finishClosing]);

  if (board.isPending) return <BoardSkeleton />;
  // Only when there's nothing to show. A failed background refresh keeps the loaded board on screen.
  if (!board.data) {
    return (
      <Failure
        title="Can’t reach your board"
        body="Your tasks are safe. Check your connection and try again."
        onRetry={() => void board.refetch()}
      />
    );
  }

  const { members, labels } = board.data;
  const allTasks = board.data.tasks; // Stats always cover the whole board, whatever the filters show.
  const isFirstRun = allTasks.length === 0;
  const filteredToNothing = !isFirstRun && visible.length === 0 && hasFilters(filters);

  // Shown in the To Do lane, where new work would appear.
  let emptyNotice = null;
  if (isFirstRun) {
    emptyNotice = (
      <BoardNotice
        title="Start with one task"
        body="Add what’s on your plate, then move it across the board as it progresses."
        action={
          <>
            <Button large variant="primary" onClick={() => setNewTaskStatus('todo')}>
              New task
            </Button>
            <Button large variant="outline" disabled={sampleBoard.isPending} onClick={() => sampleBoard.mutate()}>
              {sampleBoard.isPending ? 'Loading…' : 'Load sample board'}
            </Button>
          </>
        }
      />
    );
  } else if (filteredToNothing) {
    emptyNotice = (
      <BoardNotice
        title="No tasks match"
        body="Try a different search, or clear the filters to see the whole board."
        action={
          <Button large variant="outline" onClick={() => setFilters(NO_FILTERS)}>
            Clear filters
          </Button>
        }
      />
    );
  }

  return (
    <div className={styles.app}>
      {/* Under 1100px the panel covers this, so keyboard focus must not be able to reach it. */}
      <div className={styles.main} inert={Boolean(selected) && !closing && !isWide}>
        <TopBar
          tasks={allTasks}
          connected={connected}
          primaryAction={!isFirstRun}
          onNewTask={() => setNewTaskStatus('todo')}
          onManage={setManaging}
        />
        <FilterBar filters={filters} onChange={setFilters} members={members} labels={labels} />

        <div className={styles.boardArea}>
          <Board
            tasks={visible}
            members={members}
            labels={labels}
            actions={taskActions}
            selectedId={closing ? null : selectedId}
            onSelect={selectTask}
            onAdd={setNewTaskStatus}
            emptyNotice={emptyNotice}
          />
        </div>
      </div>

      {selected && !isWide && (
        <div className={cx(styles.scrim, closing && styles.scrimClosing)} onClick={closePanel} aria-hidden="true" />
      )}
      {selected && (
        <TaskPanel
          uid={uid}
          task={selected}
          members={members}
          labels={labels}
          actions={taskActions}
          closing={closing}
          onClose={closePanel}
          onClosed={finishClosing}
          onManage={() => setManaging('members')}
        />
      )}

      {newTaskStatus && (
        <NewTaskDialog
          initialStatus={newTaskStatus}
          members={members}
          labels={labels}
          createTask={taskActions.create}
          onClose={() => setNewTaskStatus(null)}
        />
      )}
      {managing && (
        <ManageDialog
          members={members}
          labels={labels}
          memberActions={memberActions}
          labelActions={labelActions}
          onClose={() => setManaging(null)}
          section={managing}
        />
      )}
      <Toaster />
    </div>
  );
}
