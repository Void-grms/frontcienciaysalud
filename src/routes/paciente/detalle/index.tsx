import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Info, Loader2 } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
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
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando examen...
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/paciente">
            <ArrowLeft /> Volver a mis examenes
          </Link>
        </Button>
        <p className="text-sm text-destructive">No se pudo cargar el examen.</p>
      </div>
    );
  }

  const order = query.data;
  const meta = STATE_META[order.state];
  const headerDate = order.deliveredAt ?? order.validatedAt;
  const headerLabel = order.deliveredAt ? 'Entregado' : 'Validado';

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/paciente">
          <ArrowLeft /> Volver a mis examenes
        </Link>
      </Button>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.code}</h1>
            <Badge variant={meta.variant}>{meta.label}</Badge>
            {order.previousOrderId && <Badge variant="warning">Enmienda</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {headerLabel} {formatDateTime(headerDate)}
            {order.requestingDoctor && (
              <>
                <span className="mx-2 text-border">·</span>
                Solicitado por {order.requestingDoctor}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => void handleOpen()} disabled={downloading}>
            <FileText /> Ver PDF
          </Button>
          <Button variant="outline" onClick={() => void handleDownload()} disabled={downloading}>
            {downloading ? <Loader2 className="animate-spin" /> : <Download />}
            {downloading ? 'Descargando...' : 'Descargar'}
          </Button>
        </div>
      </div>

      {order.previousOrderId && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
          <div>
            <p className="font-medium text-warning-foreground">Informe enmendado</p>
            <p className="mt-0.5 text-xs text-warning-foreground/80">
              Este informe reemplaza una version anterior. Si tienes el informe previo, considera
              este como la version vigente.
            </p>
          </div>
        </div>
      )}

      {/* Aviso de uso medico */}
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <p className="text-foreground">
          <span className="font-medium">Los resultados son de uso medico.</span> Consulta con el
          medico que ordeno los examenes antes de interpretarlos.
        </p>
      </div>

      {order.clinicalInfo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Informacion clinica</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{order.clinicalInfo}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Resultados</CardTitle>
          <p className="text-sm text-muted-foreground">
            {order.items.length} {order.items.length === 1 ? 'prueba' : 'pruebas'} ·{' '}
            <span className="text-foreground">
              Para el reporte completo con rangos de referencia, descarga el PDF.
            </span>
          </p>
        </CardHeader>
        <CardContent>
          <OrderResultsReadonly items={order.items} />
        </CardContent>
      </Card>
    </div>
  );
}
