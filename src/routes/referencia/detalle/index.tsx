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
import { formatDate, formatDateTime } from '@shared/lib/format-date';
import { reportFormError } from '@shared/lib/report-error';

import { STATE_META } from '@features/orders/state-meta';
import { referencePortalApi } from '@features/portal/api';
import { useReferenceOrder } from '@features/portal/hooks';
import { OrderResultsReadonly } from '@features/portal/order-results-readonly';

function age(birthDate: string | null): string {
  if (!birthDate) return '—';
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return '—';
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return `${a} a`;
}

export default function ReferenceOrderDetailPage() {
  const { idOrCode } = useParams<{ idOrCode: string }>();
  const query = useReferenceOrder(idOrCode ?? null);
  const [downloading, setDownloading] = useState(false);

  const handleOpen = async () => {
    if (!idOrCode) return;
    try {
      const { blob } = await referencePortalApi.downloadPdf(idOrCode);
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
      const { blob, filename } = await referencePortalApi.downloadPdf(idOrCode);
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
          <Link to="/referencia">
            <ArrowLeft className="h-4 w-4" /> Volver
          </Link>
        </Button>
        <p className="text-sm text-destructive">No se pudo cargar la orden.</p>
      </div>
    );
  }

  const order = query.data;
  const meta = STATE_META[order.state];
  const canDownload =
    order.state === 'validated' || order.state === 'delivered' || order.state === 'amended';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/referencia" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold">{order.code}</h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Creada {formatDateTime(order.createdAt)}
              {order.requestingDoctor ? ` · Solicitada por ${order.requestingDoctor}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => void handleOpen()} disabled={!canDownload}>
            <FileText className="h-4 w-4" /> Ver PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleDownload()}
            disabled={!canDownload || downloading}
          >
            <Download className="h-4 w-4" />
            {downloading ? 'Descargando...' : 'Descargar'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Nombre</dt>
                <dd className="font-medium">
                  {order.patient.lastName}, {order.patient.firstName}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Documento</dt>
                <dd className="font-mono">
                  {order.patient.documentType} {order.patient.documentNumber}
                </dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Nacimiento</dt>
                  <dd>{formatDate(order.patient.birthDate)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Edad</dt>
                  <dd>{age(order.patient.birthDate)}</dd>
                </div>
              </div>
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
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
                {canDownload
                  ? 'Para el reporte completo con rangos de referencia, descarga el PDF.'
                  : 'Los resultados estan disponibles cuando el laboratorio valide la orden.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderResultsReadonly items={order.items} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
