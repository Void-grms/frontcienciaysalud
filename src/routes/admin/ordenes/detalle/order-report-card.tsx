import { useState } from 'react';
import { Download, FileText, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import { downloadBlob } from '@shared/lib/download-blob';
import { formatDateTime } from '@shared/lib/format-date';
import { reportFormError } from '@shared/lib/report-error';

import { reportsApi } from '@features/reports/api';
import { useRegenerateReport, useReportVersions } from '@features/reports/hooks';
import type { OrderDetail } from '@features/orders/types';

interface OrderReportCardProps {
  order: OrderDetail;
}

// El backend deja generar PDF solo cuando la orden esta en validated, delivered
// o amended. Si no, mostramos el card en modo "informativo" pero deshabilitado.
function canGeneratePdf(state: OrderDetail['state']): boolean {
  return state === 'validated' || state === 'delivered' || state === 'amended';
}

export function OrderReportCard({ order }: OrderReportCardProps) {
  const available = canGeneratePdf(order.state);

  const versions = useReportVersions(available ? order.id : null);
  const regenerateMut = useRegenerateReport();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { blob, filename } = await reportsApi.downloadPdf(order.id);
      downloadBlob(blob, filename);
    } catch (err) {
      reportFormError(err);
    } finally {
      setDownloading(false);
    }
  };

  const handleOpen = async () => {
    try {
      const { blob } = await reportsApi.downloadPdf(order.id);
      // Abrimos el PDF en una pestania nueva. Importante: el ObjectURL hay
      // que liberarlo despues; lo hacemos con un timeout para darle tiempo
      // al browser de leerlo.
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleRegenerate = async () => {
    try {
      const result = await regenerateMut.mutateAsync(order.id);
      toast.success(`Nueva version v${result.version} generada`);
    } catch (err) {
      reportFormError(err);
    }
  };

  const latestVersion = versions.data?.[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-4 text-muted-foreground" />
              Informe PDF
              {available && latestVersion && (
                <Badge variant="subtle">v{latestVersion.version}</Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              {available
                ? 'Generado bajo demanda. Cada regeneracion crea una nueva version con hash SHA-256 para trazabilidad.'
                : 'Disponible cuando la orden este validada.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!available ? (
          <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-5 text-center text-sm text-muted-foreground">
            El informe se generara automaticamente al validar la orden.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void handleOpen()} disabled={downloading}>
                <FileText /> Ver PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleDownload()}
                disabled={downloading}
              >
                {downloading ? <Loader2 className="animate-spin" /> : <Download />}
                {downloading ? 'Descargando...' : 'Descargar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleRegenerate()}
                disabled={regenerateMut.isPending}
              >
                {regenerateMut.isPending ? <Loader2 className="animate-spin" /> : <RefreshCcw />}
                {regenerateMut.isPending ? 'Regenerando...' : 'Regenerar version'}
              </Button>
            </div>

            {versions.data && versions.data.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Historial de versiones
                </h4>
                <ul className="space-y-1">
                  {versions.data.map((v, idx) => (
                    <li
                      key={v.id}
                      className="flex items-center justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2.5">
                        <Badge variant={idx === 0 ? 'subtle' : 'outline'}>v{v.version}</Badge>
                        {idx === 0 && (
                          <span className="text-[10px] uppercase tracking-wider text-success">
                            actual
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(v.generatedAt)}
                        </span>
                      </div>
                      <code
                        className="hidden truncate font-mono text-[11px] text-muted-foreground sm:inline"
                        title={v.hashSha256}
                      >
                        {v.hashSha256.slice(0, 16)}…
                      </code>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
