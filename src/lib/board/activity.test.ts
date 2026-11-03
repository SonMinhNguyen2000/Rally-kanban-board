import { describe, expect, it } from 'vitest';
import { describeActivity } from './activity';

describe('describeActivity', () => {
  it('words a move with both lane names', () =>
    expect(describeActivity({ kind: 'moved', payload: { from: 'todo', to: 'in_progress' } })).toBe(
      'Moved from To Do → In Progress',
    ));

  it('covers a cleared due date', () =>
    expect(describeActivity({ kind: 'due_date_changed', payload: { from: '2026-01-01', to: null } })).toBe(
      'Removed the due date',
    ));

  it('uses the copied name', () =>
    expect(describeActivity({ kind: 'assignee_removed', payload: { name: 'Mina' } })).toBe('Unassigned Mina'));
});
