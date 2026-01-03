import { describe, it, expect } from 'vitest';

import { groupPromptChangeEvents, type PromptChangeEvent } from '../promptChangeEvents';

describe('groupPromptChangeEvents', () => {
  it('groups events with the same batch_id into a single group', () => {
    const events: PromptChangeEvent[] = [
      {
        id: 'e1',
        prompt_id: 'p1',
        event_type: 'prompt.metadata.title.updated',
        payload: { before: 'a', after: 'b' },
        batch_id: 'b1',
        created_at: '2026-01-01T00:00:02.000Z',
        created_by: 'u1',
      },
      {
        id: 'e2',
        prompt_id: 'p1',
        event_type: 'prompt.metadata.tags.updated',
        payload: { before: ['x'], after: ['x', 'y'] },
        batch_id: 'b1',
        created_at: '2026-01-01T00:00:01.000Z',
        created_by: 'u1',
      },
    ];

    const grouped = groupPromptChangeEvents(events);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.batchId).toBe('b1');
    expect(grouped[0]?.events.map((e) => e.id)).toEqual(['e1', 'e2']);
  });

  it('creates one group per event when batch_id is null', () => {
    const events: PromptChangeEvent[] = [
      {
        id: 'e1',
        prompt_id: 'p1',
        event_type: 'prompt.metadata.title.updated',
        payload: { before: 'a', after: 'b' },
        batch_id: null,
        created_at: '2026-01-01T00:00:02.000Z',
        created_by: 'u1',
      },
      {
        id: 'e2',
        prompt_id: 'p1',
        event_type: 'prompt.metadata.slug.updated',
        payload: { before: 'old', after: 'new' },
        batch_id: null,
        created_at: '2026-01-01T00:00:01.000Z',
        created_by: 'u1',
      },
    ];

    const grouped = groupPromptChangeEvents(events);
    expect(grouped).toHaveLength(2);
    expect(grouped.map((g) => g.groupId)).toEqual(['e1', 'e2']);
    expect(grouped.map((g) => g.events[0]?.id)).toEqual(['e1', 'e2']);
  });

  it('sorts groups by newest created_at first', () => {
    const events: PromptChangeEvent[] = [
      {
        id: 'e1',
        prompt_id: 'p1',
        event_type: 'prompt.metadata.title.updated',
        payload: { before: 'a', after: 'b' },
        batch_id: 'b1',
        created_at: '2026-01-01T00:00:01.000Z',
        created_by: 'u1',
      },
      {
        id: 'e2',
        prompt_id: 'p1',
        event_type: 'prompt.metadata.slug.updated',
        payload: { before: 'old', after: 'new' },
        batch_id: null,
        created_at: '2026-01-01T00:00:03.000Z',
        created_by: 'u1',
      },
    ];

    const grouped = groupPromptChangeEvents(events);
    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.groupId).toBe('e2');
    expect(grouped[1]?.groupId).toBe('b1');
  });
});
