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

// Dialog para inspeccionar el detalle de una entrada de auditoria. Muestra
// los campos basicos + el metadata JSON pretty-printeado.
export function AuditDetailDialog({ entry, onClose }: AuditDetailDialogProps) {
  return (
    <Dialog open={entry !== null} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-mono">
            {entry?.action}
            <Badge variant="outline">{entry?.entityType}</Badge>
          </DialogTitle>
          <DialogDescription>{entry && formatDateTime(entry.createdAt)}</DialogDescription>
        </DialogHeader>

        {entry && (
          <div className="space-y-4">
            {entry.summary && (
              <section>
                <h3 className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  Resumen
                </h3>
                <p className="text-sm">{entry.summary}</p>
              </section>
            )}

            <section className="grid gap-3 text-sm sm:grid-cols-2">
              <Row label="Entity ID" value={entry.entityId} mono />
              <Row label="Actor user ID" value={entry.actorUserId} mono />
              <Row label="Actor role" value={entry.actorRole} />
              <Row label="IP" value={entry.ipAddress} mono />
            </section>

            {entry.userAgent && (
              <section>
                <h3 className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                  User-Agent
                </h3>
                <p className="break-all rounded border bg-muted/40 px-2 py-1 font-mono text-xs">
                  {entry.userAgent}
                </p>
              </section>
            )}

            <section>
              <h3 className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Metadata
              </h3>
              {entry.metadata ? (
                <pre className="max-h-72 overflow-auto rounded border bg-muted/40 p-3 font-mono text-xs">
                  {JSON.stringify(entry.metadata, null, 2)}
                </pre>
              ) : (
                <p className="text-xs text-muted-foreground">Sin metadata adicional.</p>
              )}
            </section>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={mono ? 'break-all font-mono text-xs' : 'text-sm'}>{value ?? '—'}</div>
    </div>
  );
}
