import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ColorPicker } from '@/components/features/ColorPicker/ColorPicker';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog/ConfirmDialog';
import { IconButton } from '@/components/ui/IconButton/IconButton';
import type { PaletteColor } from '@/types/palette';
import styles from './ManageRow.module.css';

/**
 * One editable member or label: colour, inline name, and delete with a confirmation.
 * @param props.item - The member or label being edited.
 * @param props.noun - What the item is, such as "Member", used in labels and the name limit.
 * @param props.impact - Tells the user what deleting the item will do.
 * @param props.onRename - Saves a new name.
 * @param props.onColor - Saves a new palette colour.
 * @param props.onDelete - Deletes the item, once confirmed.
 * @returns The list row, plus the confirmation dialog while it's open.
 */
export function ManageRow({
  item,
  noun,
  impact,
  onRename,
  onColor,
  onDelete,
}: {
  item: { id: string; name: string; color: PaletteColor };
  noun: string;
  impact: string;
  onRename: (name: string) => void;
  onColor: (color: PaletteColor) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(item.name); // The draft, saved on blur.
  const [confirming, setConfirming] = useState(false);

  return (
    <li className={styles.row}>
      <ColorPicker color={item.color} onChange={onColor} name={item.name} />
      <input
        className={styles.rowInput}
        aria-label={`${noun} name`}
        value={name}
        maxLength={noun === 'Label' ? 50 : 80}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => {
          const next = name.trim();
          if (!next) setName(item.name);
          else if (next !== item.name) onRename(next);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
        }}
      />
      <IconButton label={`Delete ${item.name}`} onClick={() => setConfirming(true)}>
        <Trash2 size={14} aria-hidden="true" />
      </IconButton>
      {confirming && (
        <ConfirmDialog
          title={`Delete ${item.name}?`}
          body={impact}
          confirm={`Delete ${noun.toLowerCase()}`}
          onConfirm={onDelete}
          onClose={() => setConfirming(false)}
        />
      )}
    </li>
  );
}
