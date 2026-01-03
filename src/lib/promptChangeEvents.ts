export type PromptChangeEventType =
  | 'prompt.metadata.title.updated'
  | 'prompt.metadata.description.updated'
  | 'prompt.metadata.tags.updated'
  | 'prompt.metadata.visibility.updated'
  | 'prompt.metadata.subcategory.updated'
  | 'prompt.metadata.slug.updated';

 export type JsonPrimitive = string | number | boolean | null;
 export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
 export type JsonObject = { [key: string]: JsonValue };

export type PromptChangeEventPayload = {
  before: JsonValue;
  after: JsonValue;
};

export interface PromptChangeEvent {
  id: string;
  prompt_id: string;
  event_type: PromptChangeEventType | string;
  payload: PromptChangeEventPayload;
  batch_id: string | null;
  created_at: string;
  created_by: string;
}

export interface PromptChangeEventGroup {
  groupId: string;
  batchId: string | null;
  createdAt: string;
  createdBy: string;
  events: PromptChangeEvent[];
}

const compareIsoDesc = (aIso: string, bIso: string): number => {
  const a = Date.parse(aIso);
  const b = Date.parse(bIso);
  return b - a;
};

export const groupPromptChangeEvents = (
  events: readonly PromptChangeEvent[]
): PromptChangeEventGroup[] => {
  const batchGroups = new Map<string, PromptChangeEvent[]>();
  const noBatchEvents: PromptChangeEvent[] = [];

  for (const event of events) {
    if (event.batch_id) {
      const existing = batchGroups.get(event.batch_id);
      if (existing) {
        existing.push(event);
      } else {
        batchGroups.set(event.batch_id, [event]);
      }
    } else {
      noBatchEvents.push(event);
    }
  }

  const grouped: PromptChangeEventGroup[] = [];

  for (const [batchId, batchEvents] of batchGroups.entries()) {
    const sortedEvents = [...batchEvents].sort((a, b) =>
      compareIsoDesc(a.created_at, b.created_at)
    );

    const head = sortedEvents[0];
    if (!head) continue;

    grouped.push({
      groupId: batchId,
      batchId,
      createdAt: head.created_at,
      createdBy: head.created_by,
      events: sortedEvents,
    });
  }

  for (const event of noBatchEvents) {
    grouped.push({
      groupId: event.id,
      batchId: null,
      createdAt: event.created_at,
      createdBy: event.created_by,
      events: [event],
    });
  }

  return grouped.sort((a, b) => compareIsoDesc(a.createdAt, b.createdAt));
};
