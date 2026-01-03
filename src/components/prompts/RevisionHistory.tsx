'use client';

import { formatDistanceToNow } from 'date-fns';
import { History, RotateCcw, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export interface Revision {
  id: string;
  prompt_id: string;
  title: string;
  content: string;
  description: string | null;
  tags: string[];
  created_at: string;
  created_by: string;
  commit_message: string | null;
}

interface RevisionHistoryProps {
  revisions: Revision[];
  currentRevisionId?: string;
  onViewRevision: (revision: Revision) => void;
  onRestoreRevision: (revision: Revision) => void;
  isRestoring?: boolean;
}

export function RevisionHistory({
  revisions,
  currentRevisionId,
  onViewRevision,
  onRestoreRevision,
  isRestoring = false,
}: RevisionHistoryProps) {
  if (revisions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-3" id="revisions-empty">
        <div className="h-10 w-10 rounded-sm bg-muted flex items-center justify-center opacity-50">
          <History className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">No history yet</p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
            Changes to this prompt will appear here as revisions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full" id="revisions-accordion">
      <AccordionItem value="history" className="border-none">
        <AccordionTrigger className="hover:no-underline py-0" id="revisions-trigger">
          <div className="flex items-center justify-between w-full pr-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Revision History
            </h3>
            <Badge variant="secondary" className="text-[0.7rem] h-4 rounded-sm font-mono py-3">
              {revisions.length} {revisions.length === 1 ? 'version' : 'versions'}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 pb-0" id="revisions-content">
          <div className="space-y-4" id="revisions-container">
            <ScrollArea className="h-[400px] -mx-1 px-1" id="revisions-scroll">
              <div className="space-y-2">
                {revisions.map((revision, idx) => (
                  <div
                    key={revision.id}
                    className={cn(
                      "group relative rounded-sm border p-3 transition-all hover:border-brand/40",
                      currentRevisionId === revision.id
                        ? "bg-brand/5 border-brand/30 ring-1 ring-brand/20"
                        : "bg-card/50 border-border/50"
                    )}
                    id={`revision-item-${revision.id}`}
                  >
                    <div className="flex items-center justify-between gap-3 min-w-0">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-bold font-mono text-brand bg-brand/5 px-1 py-0.5 rounded border border-brand/10 shrink-0">
                          v{revisions.length - idx}
                        </span>
                        <span className="text-[11px] font-medium text-foreground truncate">
                          {revision.title}
                        </span>
                        {revision.commit_message && (
                          <span className="text-[10px] text-muted-foreground truncate italic opacity-80">
                            - {revision.commit_message}
                          </span>
                        )}
                        <span className="text-[9px] text-muted-foreground shrink-0 opacity-70">
                          • {formatDistanceToNow(new Date(revision.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-brand hover:bg-brand/10"
                          onClick={() => onViewRevision(revision)}
                          title="View snapshot"
                          id={`btn-view-revision-${revision.id}`}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-brand hover:bg-brand/10"
                          onClick={() => onRestoreRevision(revision)}
                          disabled={isRestoring}
                          title="Restore this version"
                          id={`btn-restore-revision-${revision.id}`}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {currentRevisionId === revision.id && (
                      <div className="absolute -left-px top-1/2 -translate-y-1/2 w-0.5 h-6 bg-brand rounded-r-full" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            <p className="text-[10px] text-muted-foreground text-center italic px-4">
              Restoring a version will create a new revision from the selected snapshot.
            </p>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
