import { FileSearch } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { formatDateTime } from '@shared/lib/format-date';

import type { AuditEntry } from '@features/audit/types';

interface AuditDetailDialogProps {
  entry: AuditEntry | null;
  onClose: () => void;
}

export function AuditDetailDialog({ entry, onClose }: AuditDetailDialogProps) {
  return (
    <Dialog open={entry !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-2.5">
            <div
              className="grid size-9 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-700"
              aria-hidden
            >
              <FileSearch className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="flex flex-wrap items-center gap-2">
                <code className="font-mono">{entry?.action}</code>
                <Badge variant="outline">{entry?.entityType}</Badge>
              </DialogTitle>
              <DialogDescription className="tabular-nums">
                {entry && formatDateTime(entry.createdAt)}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {entry && (
          <div className="space-y-5">
            {entry.summary && (
              <Section title="Resumen">
                <p className="text-sm leading-relaxed">{entry.summary}</p>
              </Section>
            )}

            <Section title="Contexto">
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <Row label="Entity ID" value={entry.entityId} mono />
                <Row label="Actor user ID" value={entry.actorUserId} mono />
                <Row label="Actor role" value={entry.actorRole} />
                <Row label="IP" value={entry.ipAddress} mono />
              </dl>
            </Section>

            {entry.userAgent && (
              <Section title="User-Agent">
                <p className="break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs leading-relaxed">
                  {entry.userAgent}
                </p>
              </Section>
            )}

            <Section title="Metadata">
              {entry.metadata ? (
                <pre className="max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-3 font-mono text-[11px] leading-relaxed">
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">Sin metadata adicional.</p>
              )}
            </Section>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className={mono ? 'mt-0.5 break-all font-mono text-xs' : 'mt-0.5 text-sm'}>
        {value ?? <span className="text-muted-foreground/60">—</span>}
      </dd>
    </div>
  );
}
