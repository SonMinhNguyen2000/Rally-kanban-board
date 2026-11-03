import type { Task } from '@/types/task';

/**
 * Test helper: a valid task with sensible defaults, overridden field by field.
 * @param overrides - The fields to change from the defaults.
 * @returns The task.
 */
export function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't',
    title: 'Task',
    description: null,
    status: 'todo',
    priority: 'normal',
    due_date: null,
    position: 1024,
    user_id: 'u',
    created_at: '2026-11-01T00:00:00Z',
    updated_at: '2026-11-01T00:00:00Z',
    assignee_ids: [],
    label_ids: [],
    comment_count: 0,
    ...overrides,
  };
}
