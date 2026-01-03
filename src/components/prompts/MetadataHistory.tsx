'use client';

import { format, formatDistanceToNow } from 'date-fns';
import { Clock, Activity } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import {
  groupPromptChangeEvents,
  type PromptChangeEvent,
  type PromptChangeEventGroup,
  type JsonValue,
} from '@/lib/promptChangeEvents';

interface MetadataHistoryProps {
  events: PromptChangeEvent[];
}

const formatAuthor = (authorId: string): string => {
  if (authorId.length <= 12) return authorId;
  return `${authorId.slice(0, 8)}…${authorId.slice(-4)}`;
};

const stringifyJsonValue = (value: JsonValue): string => {
  if (value === null) return 'null';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  return JSON.stringify(value);
};

const getEventLabel = (eventType: string): string => {
  switch (eventType) {
    case 'prompt.metadata.title.updated':
      return 'Title';
    case 'prompt.metadata.description.updated':
      return 'Description';
    case 'prompt.metadata.tags.updated':
      return 'Tags';
    case 'prompt.metadata.visibility.updated':
      return 'Visibility';
    case 'prompt.metadata.subcategory.updated':
      return 'Subcategory';
    case 'prompt.metadata.slug.updated':
      return 'Slug';
    default:
      return eventType;
  }
};

const summarizeGroup = (group: PromptChangeEventGroup): string => {
  const changeCount = group.events.length;
  if (changeCount === 1) return 'Updated metadata (1 change)';
  return `Updated metadata (${changeCount} changes)`;
};

export function MetadataHistory({ events }: MetadataHistoryProps) {
  const groups = groupPromptChangeEvents(events);

  if (groups.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-12 text-center space-y-3"
        id="metadata-history-empty"
      >
        <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center opacity-50">
          <Activity className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">No metadata activity yet</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Changes to metadata will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full" id="metadata-history-accordion">
      <AccordionItem value="history" className="border-none">
        <AccordionTrigger className="hover:no-underline py-0" id="metadata-history-trigger">
          <div className="flex items-center justify-between w-full pr-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Metadata History
            </h3>
            <Badge variant="secondary" className="text-[0.7rem] h-4 rounded-sm font-mono py-3">
              {events.length} {events.length === 1 ? 'event' : 'events'}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0" id="metadata-history-content">
          <div className="space-y-4" id="metadata-history-container">
            <ScrollArea className="h-[400px] -mx-1 px-1" id="metadata-history-scroll">
              <div className="space-y-2" id="metadata-history-groups">
                {groups.map((group) => {
                  const whenLabel = formatDistanceToNow(new Date(group.createdAt), {
                    addSuffix: true,
                  });
                  const timestampLabel = format(new Date(group.createdAt), 'PPpp');
                  const authorLabel = formatAuthor(group.createdBy);

                  return (
                    <div
                      key={group.groupId}
                      className={cn(
                        'rounded-sm border p-3 transition-all hover:border-brand/40',
                        'bg-card/50 border-border/50'
                      )}
                      id={`metadata-group-${group.groupId}`}
                    >
                      <div className="flex items-start justify-between gap-3" id={`metadata-group-top-${group.groupId}`}>
                        <div className="min-w-0" id={`metadata-group-left-${group.groupId}`}>
                          <div className="text-[11px] font-medium text-foreground" id={`metadata-group-title-${group.groupId}`}>
                            {summarizeGroup(group)}
                          </div>
                          <div className="text-[10px] text-muted-foreground" id={`metadata-group-meta-${group.groupId}`}>
                            {authorLabel} • {whenLabel}
                          </div>
                        </div>
                        <div
                          className="text-[10px] text-muted-foreground font-mono whitespace-nowrap"
                          id={`metadata-group-timestamp-${group.groupId}`}
                          title={timestampLabel}
                        >
                          {whenLabel}
                        </div>
                      </div>

                      <div className="mt-2 space-y-2" id={`metadata-group-events-${group.groupId}`}>
                        {group.events.map((event) => {
                          const label = getEventLabel(event.event_type);
                          const before = stringifyJsonValue(event.payload.before);
                          const after = stringifyJsonValue(event.payload.after);

                          return (
                            <div
                              key={event.id}
                              className="rounded-sm border bg-muted/10 px-2.5 py-2"
                              id={`metadata-event-${event.id}`}
                            >
                              <div className="flex items-center justify-between gap-3" id={`metadata-event-top-${event.id}`}>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase" id={`metadata-event-label-${event.id}`}>
                                  {label}
                                </div>
                                <div className="text-[10px] text-muted-foreground font-mono" id={`metadata-event-id-${event.id}`}>
                                  {event.id.slice(0, 8)}…
                                </div>
                              </div>
                              <div className="mt-1 grid grid-cols-2 gap-2" id={`metadata-event-grid-${event.id}`}>
                                <div className="min-w-0" id={`metadata-event-before-${event.id}`}>
                                  <div className="text-[9px] text-muted-foreground font-semibold uppercase">Before</div>
                                  <div className="text-[11px] text-foreground font-mono whitespace-pre-wrap break-words">{before}</div>
                                </div>
                                <div className="min-w-0" id={`metadata-event-after-${event.id}`}>
                                  <div className="text-[9px] text-muted-foreground font-semibold uppercase">After</div>
                                  <div className="text-[11px] text-foreground font-mono whitespace-pre-wrap break-words">{after}</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <p className="text-[10px] text-muted-foreground text-center italic px-4" id="metadata-history-footnote">
              Metadata history is private to the prompt owner.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
