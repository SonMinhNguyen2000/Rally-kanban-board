import { Picker } from '@/components/ui/Picker/Picker';
import { Swatch } from '@/components/ui/Swatch/Swatch';
import { PALETTE, type PaletteColor } from '@/types/palette';
import styles from './ColorPicker.module.css';

/**
 * A swatch button that opens the palette, for choosing a member's or label's colour.
 * @param props.color - The current colour.
 * @param props.onChange - Receives the newly chosen colour.
 * @param props.name - What the colour belongs to, for the accessible labels.
 * @returns The swatch button and its palette menu.
 */
export function ColorPicker({
  color,
  onChange,
  name,
}: {
  color: PaletteColor;
  onChange: (color: PaletteColor) => void;
  name: string;
}) {
  return (
    <Picker<PaletteColor>
      label={`Colour for ${name}`}
      options={PALETTE.map((value) => ({
        value,
        label: value[0]?.toUpperCase() + value.slice(1),
        leading: <Swatch color={value} />,
      }))}
      selected={[color]}
      onToggle={(value) => onChange(value)}
      triggerClassName={styles.colorTrigger}
      triggerLabel={`Colour for ${name}: ${color}. Change colour`}
      trigger={<Swatch color={color} />}
    />
  );
}
