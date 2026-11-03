import { X } from 'lucide-react';
import { paletteVars } from '@/lib/ui/paletteVars';
import type { Label } from '@/types/label';
import styles from './LabelChip.module.css';

/**
 * A label in its palette colours, with a remove button when `onRemove` is given.
 * @param props.label - The name and palette colour to show.
 * @param props.onRemove - Optional handler for the remove button.
 * @returns The chip element.
 */
export function LabelChip({ label, onRemove }: { label: Pick<Label, 'name' | 'color'>; onRemove?: () => void }) {
  return (
    <span className={styles.chip} style={paletteVars(label.color)} title={label.name}>
      <span className={styles.text}>{label.name}</span>
      {onRemove && (
        <button type="button" className={styles.remove} onClick={onRemove} aria-label={`Remove ${label.name}`}>
          <X size={12} aria-hidden="true" />
        </button>
      )}
    </span>
  );
}
