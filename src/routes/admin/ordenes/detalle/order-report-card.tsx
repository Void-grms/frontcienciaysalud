import { useState } from 'react';
import { Download, FileText, RefreshCcw } from 'lucide-react';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" /> Informe PDF
        </CardTitle>
        <CardDescription>
          {available
            ? 'El informe se genera bajo demanda. Cada regeneracion crea una nueva version con hash SHA-256 para trazabilidad.'
            : `Disponible cuando la orden este validada. Estado actual: ${order.state}.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void handleOpen()} disabled={!available || downloading}>
            <FileText className="h-4 w-4" /> Ver PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleDownload()}
            disabled={!available || downloading}
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando...' : 'Descargar'}
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleRegenerate()}
            disabled={!available || regenerateMut.isPending}
          >
            <RefreshCcw className="h-4 w-4" />
            {regenerateMut.isPending ? 'Regenerando...' : 'Regenerar version'}
          </Button>
        </div>

        {available && versions.data && versions.data.length > 0 && (
          <div className="rounded-md border bg-muted/30 p-3">
            <h4 className="mb-2 text-sm font-medium">Historial de versiones</h4>
            <ul className="space-y-1.5">
              {versions.data.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between gap-3 rounded border bg-background px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">v{v.version}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(v.generatedAt)}
                    </span>
                  </div>
                  <code className="hidden truncate font-mono text-[11px] text-muted-foreground sm:inline">
                    {v.hashSha256.slice(0, 16)}…
                  </code>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
