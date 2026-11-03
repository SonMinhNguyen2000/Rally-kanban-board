import { useDroppable } from '@dnd-kit/core';
import { StatusMark } from '@/components/ui/StatusMark/StatusMark';
import { trayDropId } from '@/lib/board/dropTargets';
import { cx } from '@/lib/ui/cx';
import { LANE, type Status } from '@/types/task';
import styles from './TrayTarget.module.css';

/**
 * One lane's drop zone in the phone drag tray. A card dropped here joins the end of that lane.
 * @param props.status - The lane this zone stands for.
 * @returns The drop zone.
 */
export function TrayTarget({ status }: { status: Status }) {
  const { setNodeRef, isOver } = useDroppable({ id: trayDropId(status) });
  return (
    <div ref={setNodeRef} className={cx(styles.trayTarget, isOver && styles.trayTargetOver)}>
      <StatusMark status={status} />
      <span>{LANE[status].name}</span>
    </div>
  );
}
