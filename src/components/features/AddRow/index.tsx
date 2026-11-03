import { useState, type FormEvent } from 'react';
import { ColorPicker } from '@/components/features/ColorPicker';
import { Button } from '@/components/ui/Button';
import { FieldError } from '@/components/ui/FieldError';
import { TextInput } from '@/components/ui/TextInput';
import { friendlyError } from '@/lib/errors';
import type { PaletteColor } from '@/types/palette';
import styles from './AddRow.module.css';

/**
 * The form for adding a member or label. The name stays in place if adding fails.
 * @param props.noun - What is being added, such as "Member", used in labels and errors.
 * @param props.placeholder - The hint shown in the empty name field.
 * @param props.maxLength - The longest name the database accepts.
 * @param props.nextColor - The suggested colour, used until the user picks another.
 * @param props.onAdd - Saves the new item, and rejects if it can't be saved.
 * @returns The add form, with a colour picker, name field, button and any error.
 */
export function AddRow({
  noun,
  placeholder,
  maxLength,
  nextColor,
  onAdd,
}: {
  noun: string;
  placeholder: string;
  maxLength: number;
  nextColor: PaletteColor;
  onAdd: (name: string, color: PaletteColor) => Promise<unknown>;
}) {
  const [name, setName] = useState('');
  const [color, setColor] = useState<PaletteColor | null>(null); // Null means the suggested colour.
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chosen = color ?? nextColor; // Suggested colours keep a new team varied without any effort.

  /**
   * Adds the item, then resets the form for the next one.
   * @param event - The form submission, whose default page reload is prevented.
   * @returns A promise that settles once saving has finished.
   */
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await onAdd(trimmed, chosen);
      setName('');
      setColor(null);
    } catch (caught) {
      setError(friendlyError(caught, `Couldn’t add that ${noun.toLowerCase()}.`));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={(event) => void submit(event)}>
      <div className={styles.addRow}>
        <ColorPicker color={chosen} onChange={setColor} name={`the new ${noun.toLowerCase()}`} />
        <TextInput
          className={styles.nameInput}
          aria-label={`New ${noun.toLowerCase()} name`}
          placeholder={placeholder}
          value={name}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          onChange={(event) => {
            setName(event.target.value);
            setError(null);
          }}
        />
        <Button large variant="outline" type="submit" disabled={saving || name.trim() === ''}>
          {saving ? 'Adding…' : 'Add'}
        </Button>
      </div>
      {error && <FieldError>{error}</FieldError>}
    </form>
  );
}
