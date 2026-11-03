import { ChevronDown, ListFilter, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Button } from '@/components/ui/Button/Button';
import { LabelChip } from '@/components/ui/LabelChip/LabelChip';
import { Picker } from '@/components/ui/Picker/Picker';
import { Swatch } from '@/components/ui/Swatch/Swatch';
import { hasFilters } from '@/lib/board/filters';
import { cx } from '@/lib/ui/cx';
import { NO_FILTERS, type Filters } from '@/types/filters';
import type { Label } from '@/types/label';
import { PRIORITIES, PRIORITY_NAME, type Priority } from '@/types/task';
import type { TeamMember } from '@/types/team';
import styles from './FilterBar.module.css';

/** Props for the filter bar. The parent owns the filter state. */
interface FilterBarProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
  members: TeamMember[];
  labels: Label[];
}

/**
 * A count suffix for a filter button, or nothing when that filter is off.
 * @param values - The filter's selected values.
 * @returns The suffix, such as " · 2", or an empty string.
 */
function countSuffix(values: unknown[]) {
  return values.length > 0 ? ` · ${values.length}` : '';
}

/**
 * A filter button's contents. Picker supplies the shared dropdown caret.
 * @param name - The filter's name.
 * @param values - The filter's selected values.
 * @returns The name followed by its count.
 */
function triggerContent(name: string, values: unknown[]) {
  return (
    <>
      {name}
      {countSuffix(values)}
    </>
  );
}

/**
 * Search and the priority, assignee and label filters. Collapses behind a button on phones.
 * @param props.filters - The current filter state.
 * @param props.onChange - Receives the updated filter state.
 * @param props.members - Every team member, for the assignee filter.
 * @param props.labels - Every label, for the label filter.
 * @returns The filter bar.
 */
export function FilterBar({ filters, onChange, members, labels }: FilterBarProps) {
  const [expanded, setExpanded] = useState(false); // Phones only: whether the controls show.
  const active = hasFilters(filters);

  /**
   * Adds a value to one of the list filters, or removes it.
   * @param key - The filter to change.
   * @param value - The value to add or remove.
   * @param on - True to add the value, false to remove it.
   */
  const toggle = (key: 'priorities' | 'assignees' | 'labels', value: string, on: boolean) => {
    const current = filters[key] as string[];
    onChange({
      ...filters,
      [key]: on ? [...current, value] : current.filter((item) => item !== value),
    });
  };

  // The total shown on the phone Filters button.
  const selectedCount = filters.priorities.length + filters.assignees.length + filters.labels.length;

  return (
    <div className={styles.filterbar} role="search" aria-label="Filter tasks">
      <div className={styles.filterRow}>
        <label className={styles.search}>
          <Search size={14} aria-hidden="true" />
          <span className="sr-only">Search tasks by title</span>
          <input
            type="search"
            placeholder="Search tasks"
            value={filters.search}
            onChange={(event) => onChange({ ...filters, search: event.target.value })}
          />
        </label>
        <button
          type="button"
          className={styles.filtersToggle}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <ListFilter size={16} aria-hidden="true" />
          Filters{selectedCount > 0 ? ` · ${selectedCount}` : ''}
          <ChevronDown size={14} aria-hidden="true" />
        </button>
      </div>
      <div className={cx(styles.filterControls, expanded && styles.filterControlsOpen)}>
        <Picker<Priority>
          label="Filter by priority"
          multiple
          options={PRIORITIES.map((priority) => ({ value: priority, label: PRIORITY_NAME[priority] }))}
          selected={filters.priorities}
          onToggle={(value, on) => toggle('priorities', value, on)}
          triggerClassName={styles.filterTrigger}
          trigger={triggerContent('Priority', filters.priorities)}
        />
        <Picker
          label="Filter by assignee"
          multiple
          options={members.map((member) => ({
            value: member.id,
            label: member.name,
            leading: <Avatar member={member} />,
          }))}
          selected={filters.assignees}
          onToggle={(value, on) => toggle('assignees', value, on)}
          triggerClassName={styles.filterTrigger}
          trigger={triggerContent('Assignee', filters.assignees)}
          emptyText="No team members yet"
        />
        <Picker
          label="Filter by label"
          multiple
          options={labels.map((label) => ({
            value: label.id,
            label: label.name,
            leading: <Swatch color={label.color} />,
          }))}
          selected={filters.labels}
          onToggle={(value, on) => toggle('labels', value, on)}
          triggerClassName={styles.filterTrigger}
          trigger={triggerContent('Label', filters.labels)}
          emptyText="No labels yet"
        />
        <div className={styles.activeChips}>
          {filters.labels.flatMap((id) => {
            const label = labels.find((item) => item.id === id);
            return label ? <LabelChip key={id} label={label} onRemove={() => toggle('labels', id, false)} /> : [];
          })}
        </div>
        {active && (
          <Button onClick={() => onChange(NO_FILTERS)}>
            <X size={14} aria-hidden="true" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
