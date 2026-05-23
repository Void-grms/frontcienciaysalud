import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText } from 'lucide-react';

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

import { STATE_META } from '@features/orders/state-meta';
import { patientPortalApi } from '@features/portal/api';
import { usePatientOrder } from '@features/portal/hooks';
import { OrderResultsReadonly } from '@features/portal/order-results-readonly';

export default function PatientOrderDetailPage() {
  const { idOrCode } = useParams<{ idOrCode: string }>();
  const query = usePatientOrder(idOrCode ?? null);
  const [downloading, setDownloading] = useState(false);

  const handleOpen = async () => {
    if (!idOrCode) return;
    try {
      const { blob } = await patientPortalApi.downloadPdf(idOrCode);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleDownload = async () => {
    if (!idOrCode) return;
    setDownloading(true);
    try {
      const { blob, filename } = await patientPortalApi.downloadPdf(idOrCode);
      downloadBlob(blob, filename);
    } catch (err) {
      reportFormError(err);
    } finally {
      setDownloading(false);
    }
  };

  if (query.isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando orden...</p>;
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/paciente">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>
        <p className="text-sm text-destructive">No se pudo cargar la orden.</p>
      </div>
    );
  }

  const order = query.data;
  const meta = STATE_META[order.state];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/paciente" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold">{order.code}</h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {order.deliveredAt
                ? `Entregada ${formatDateTime(order.deliveredAt)}`
                : `Validada ${formatDateTime(order.validatedAt)}`}
              {order.requestingDoctor ? ` · Solicitada por ${order.requestingDoctor}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => void handleOpen()}>
            <FileText className="h-4 w-4" /> Ver PDF
          </Button>
          <Button variant="outline" onClick={() => void handleDownload()} disabled={downloading}>
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando...' : 'Descargar'}
          </Button>
        </div>
      </div>

      {order.previousOrderId && (
        <div className="rounded-md border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm">
          Este informe es una enmienda de una orden anterior. Si tienes el informe previo, este
          reemplaza esos resultados.
        </div>
      )}

      {order.clinicalInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacion clinica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm">{order.clinicalInfo}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            {order.items.length} {order.items.length === 1 ? 'prueba' : 'pruebas'}. Para el reporte
            completo con rangos de referencia, descarga el PDF.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrderResultsReadonly items={order.items} />
        </CardContent>
      </Card>
    </div>
  );
}
