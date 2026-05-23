import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Info,
  Loader2,
  Lock,
  Save,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { cn } from '@shared/lib/cn';
import { formatDateTime } from '@shared/lib/format-date';
import { reportFormError } from '@shared/lib/report-error';

import { useTestsBatch } from '@features/catalog/use-tests-batch';
import { useOrderDetail, useValidateOrder } from '@features/orders/hooks';
import { STATE_META } from '@features/orders/state-meta';
import { useAutosave, type SaveStatus } from '@features/results/use-autosave';
import type { BulkResultEntry } from '@features/results/types';

import { ResultRow, type DraftResult } from './result-row';

const STATUS_META: Record<
  SaveStatus,
  { label: string; icon: typeof CloudUpload; className: string; spin?: boolean }
> = {
  idle: {
    label: 'Sin cambios',
    icon: CheckCircle2,
    className: 'text-muted-foreground',
  },
  pending: {
    label: 'Cambios pendientes',
    icon: CloudUpload,
    className: 'text-warning-foreground',
  },
  saving: {
    label: 'Guardando...',
    icon: Loader2,
    className: 'text-info',
    spin: true,
  },
  saved: {
    label: 'Guardado',
    icon: CheckCircle2,
    className: 'text-success',
  },
  error: {
    label: 'Error al guardar',
    icon: AlertTriangle,
    className: 'text-destructive',
  },
};

export default function ResultadosPage() {
  const { idOrCode } = useParams<{ idOrCode: string }>();
  const navigate = useNavigate();
  const detailQuery = useOrderDetail(idOrCode ?? null);
  const validateMut = useValidateOrder();

  const [drafts, setDrafts] = useState<Map<string, DraftResult>>(new Map());
  const order = detailQuery.data;

  const qualitativeTestIds = useMemo(() => {
    if (!order) return [];
    const set = new Set<string>();
    for (const it of order.items) {
      if (it.test.resultType === 'qualitative') set.add(it.test.id);
    }
    return Array.from(set);
  }, [order]);
  const tests = useTestsBatch(qualitativeTestIds);

  const patchDraft = (itemId: string, patch: Partial<DraftResult>) => {
    setDrafts((prev) => {
      const next = new Map(prev);
      const current = next.get(itemId) ?? {
        valueNumeric: undefined,
        valueText: undefined,
        observation: undefined,
      };
      next.set(itemId, { ...current, ...patch });
      return next;
    });
  };

  const buildEntries = (): BulkResultEntry[] => {
    const entries: BulkResultEntry[] = [];
    for (const [orderItemId, d] of drafts.entries()) {
      const hasChange =
        d.valueNumeric !== undefined ||
        d.valueText !== undefined ||
        d.observation !== undefined;
      if (!hasChange) continue;
      entries.push({
        orderItemId,
        ...(d.valueNumeric !== undefined ? { valueNumeric: d.valueNumeric } : {}),
        ...(d.valueText !== undefined ? { valueText: d.valueText } : {}),
        ...(d.observation !== undefined ? { observation: d.observation } : {}),
      });
    }
    return entries;
  };

  const autosave = useAutosave({
    orderId: order?.id ?? null,
    buildEntries,
    onSaved: () => setDrafts(new Map()),
    onError: (err) => reportFormError(err),
  });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (autosave.hasPending) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [autosave.hasPending]);

  const handleSaveNow = async () => {
    if (!order) return;
    await autosave.flush();
  };

  const handleValidate = async () => {
    if (!order) return;
    if (autosave.hasPending) {
      await autosave.flush();
      if (autosave.hasPending) return;
    }
    try {
      await validateMut.mutateAsync(order.id);
      toast.success('Orden validada correctamente');
      navigate(`/admin/ordenes/${order.code}`);
    } catch (err) {
      reportFormError(err);
    }
  };

  if (detailQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Cargando orden...
      </div>
    );
  }
  if (!order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/ordenes">
            <ArrowLeft /> Volver a ordenes
          </Link>
        </Button>
        <p className="text-sm text-destructive">No se pudo cargar la orden.</p>
      </div>
    );
  }

  const meta = STATE_META[order.state];
  const editable = order.state === 'draft' || order.state === 'in_progress';
  const itemsWithResult = order.items.filter((i) => i.result !== null).length;
  const total = order.items.length;
  const allFilled = total > 0 && itemsWithResult === total;
  const remaining = total - itemsWithResult;
  const progress = total === 0 ? 0 : (itemsWithResult / total) * 100;
  const statusMeta = STATUS_META[autosave.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to={`/admin/ordenes/${order.code}`}>
            <ArrowLeft /> Volver al detalle
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">Captura de resultados</h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-mono font-medium text-foreground">{order.code}</span>
              <span className="mx-2 text-border">·</span>
              {order.patient.lastName}, {order.patient.firstName}
              <span className="mx-2 text-border">·</span>
              <span className="font-mono tabular-nums">{order.patient.documentNumber}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Progress + autosave status */}
      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Progreso de captura
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">
                  {itemsWithResult}
                  <span className="text-base text-muted-foreground">/{total}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {allFilled
                    ? 'lista para validar'
                    : `${remaining} ${remaining === 1 ? 'prueba pendiente' : 'pruebas pendientes'}`}
                </span>
              </div>
            </div>

            <div className={cn('flex items-center gap-1.5 text-xs', statusMeta.className)}>
              <StatusIcon className={cn('size-4', statusMeta.spin && 'animate-spin')} />
              <span className="font-medium">{statusMeta.label}</span>
              {autosave.lastSavedAt && autosave.status !== 'saving' && (
                <span className="text-muted-foreground">
                  · {formatDateTime(new Date(autosave.lastSavedAt))}
                </span>
              )}
            </div>
          </div>

          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500 ease-out',
                allFilled ? 'bg-success' : 'bg-primary',
              )}
              style={{ width: `${progress}%` }}
              aria-hidden
            />
          </div>
        </CardContent>
      </Card>

      {/* Read-only banner */}
      {!editable && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <Lock className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
          <div>
            <p className="font-medium text-warning-foreground">Modo solo lectura</p>
            <p className="mt-0.5 text-xs text-warning-foreground/80">
              La orden esta en estado &quot;{meta.label.toLowerCase()}&quot;. No se pueden modificar
              resultados.
            </p>
          </div>
        </div>
      )}

      {/* Info banner sobre autosave */}
      {editable && (
        <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
          <div className="space-y-0.5">
            <p className="text-foreground">
              <span className="font-medium">Autoguardado activo.</span> Los cambios se persisten
              cada 10 s o al pulsar &quot;Guardar ahora&quot;.
            </p>
            <p className="text-xs text-muted-foreground">
              El flag (normal / alto / bajo / critico) se recalcula en el servidor con cada save
              segun la edad y el sexo del paciente.
            </p>
          </div>
        </div>
      )}

      {/* Tabla de pruebas */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[110px]">
                    Codigo
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Prueba
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[200px]">
                    Valor
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[110px]">
                    Flag
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Observacion
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const draft = drafts.get(item.id) ?? {
                    valueNumeric: undefined,
                    valueText: undefined,
                    observation: undefined,
                  };
                  return (
                    <ResultRow
                      key={item.id}
                      item={item}
                      test={tests.byId.get(item.test.id) ?? null}
                      draft={draft}
                      disabled={!editable}
                      onPatch={(patch) => {
                        patchDraft(item.id, patch);
                        autosave.markDirty();
                      }}
                    />
                  );
                })}
                {order.items.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-10 text-center text-sm text-muted-foreground">
                      La orden no tiene pruebas todavia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sticky action bar al pie */}
      {editable && (
        <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:left-64">
          <div className="container flex items-center justify-between gap-3 py-3">
            <div className="text-xs text-muted-foreground">
              {allFilled ? (
                <span className="flex items-center gap-1.5 text-success">
                  <CheckCircle2 className="size-3.5" />
                  Todas las pruebas tienen resultado. Lista para validar.
                </span>
              ) : (
                <>
                  Faltan{' '}
                  <span className="font-semibold tabular-nums text-foreground">{remaining}</span>{' '}
                  {remaining === 1 ? 'prueba' : 'pruebas'} antes de poder validar.
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleSaveNow()}
                disabled={!autosave.hasPending || autosave.status === 'saving'}
              >
                <Save /> Guardar ahora
              </Button>
              <Button
                size="sm"
                onClick={() => void handleValidate()}
                disabled={!allFilled || validateMut.isPending}
              >
                {validateMut.isPending ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
                {validateMut.isPending ? 'Validando...' : 'Validar orden'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
