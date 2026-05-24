import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Info, Loader2, User } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
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
  return `${a} anos`;
}

function patientInitials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?';
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
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando orden...
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/referencia">
            <ArrowLeft /> Volver a ordenes
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
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/referencia">
          <ArrowLeft /> Volver a ordenes
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-mono text-2xl font-semibold tracking-tight">{order.code}</h1>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Creada {formatDateTime(order.createdAt)}
            {order.requestingDoctor && (
              <>
                <span className="mx-2 text-border">·</span>
                Solicitada por {order.requestingDoctor}
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => void handleOpen()} disabled={!canDownload || downloading}>
            <FileText /> Ver PDF
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleDownload()}
            disabled={!canDownload || downloading}
          >
            {downloading ? <Loader2 className="animate-spin" /> : <Download />}
            {downloading ? 'Descargando...' : 'Descargar'}
          </Button>
        </div>
      </div>

      {!canDownload && (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
          <p className="text-foreground">
            <span className="font-medium">El PDF aun no esta disponible.</span> Aparecera cuando el
            laboratorio valide los resultados.
          </p>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tarjeta paciente */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5 sm:p-6">
            <div className="flex items-start gap-3 pb-4">
              <div
                className="grid size-12 shrink-0 place-items-center rounded-full bg-primary-50 text-base font-semibold text-primary-700"
                aria-hidden
              >
                {patientInitials(order.patient.firstName, order.patient.lastName)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-base font-semibold leading-tight">
                  {order.patient.firstName} {order.patient.lastName}
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <User className="size-3" />
                  <span className="font-mono tabular-nums">
                    {order.patient.documentType} {order.patient.documentNumber}
                  </span>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Nacimiento
                  </dt>
                  <dd className="mt-0.5 tabular-nums">{formatDate(order.patient.birthDate)}</dd>
                </div>
                <div>
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Edad
                  </dt>
                  <dd className="mt-0.5 font-medium tabular-nums">
                    {age(order.patient.birthDate)}
                  </dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
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
                {canDownload
                  ? 'Para el reporte completo con rangos de referencia, descarga el PDF.'
                  : 'Los resultados estan disponibles cuando el laboratorio valide la orden.'}
              </p>
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
