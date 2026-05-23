import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  CloudUpload,
  Loader2,
  Save,
} from 'lucide-react';
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
  { label: string; icon: typeof CloudUpload; className: string }
> = {
  idle: { label: 'Sin cambios', icon: CheckCircle2, className: 'text-muted-foreground' },
  pending: { label: 'Cambios pendientes...', icon: CloudUpload, className: 'text-amber-700' },
  saving: { label: 'Guardando...', icon: Loader2, className: 'text-blue-700' },
  saved: { label: 'Guardado', icon: CheckCircle2, className: 'text-emerald-700' },
  error: { label: 'Error al guardar', icon: AlertTriangle, className: 'text-destructive' },
};

export default function ResultadosPage() {
  const { idOrCode } = useParams<{ idOrCode: string }>();
  const navigate = useNavigate();
  const detailQuery = useOrderDetail(idOrCode ?? null);
  const validateMut = useValidateOrder();

  // Drafts en memoria: una entrada por orderItemId con los campos que cambiaron.
  // Campos no presentes (undefined) significan "no enviar"; null o valor
  // explicito si se quiere limpiar o setear.
  const [drafts, setDrafts] = useState<Map<string, DraftResult>>(new Map());

  const order = detailQuery.data;

  // Pruebas cualitativas necesitan sus options. Cargamos solo esas para
  // ahorrar requests; las numericas/text no requieren detalle del test.
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

  // El callback se llama justo antes de cada guardado, asi siempre ve el
  // estado mas reciente (evita capturas obsoletas del closure).
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

  // Refrescos del lado del backend (flags recalculados) se reflejan via
  // invalidacion del query. Para que el usuario sepa que "se guardo", el
  // toast de exito lo manejamos con un efecto cuando status cambia.
  useEffect(() => {
    if (autosave.status === 'saved' && autosave.lastSavedAt) {
      // No mostramos toast porque la UI ya tiene el indicador. Pero podemos
      // poner un mensaje sutil si el usuario quiere asegurarse:
      // toast.success("Resultados guardados", { id: "autosave" });
    }
  }, [autosave.status, autosave.lastSavedAt]);

  // Advertencia al cerrar/recargar si hay cambios sin guardar.
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
    // Antes de validar siempre forzamos un flush para no perder los ultimos
    // cambios del usuario, y solo si el flush no dejo errores intentamos
    // validar.
    if (autosave.hasPending) {
      await autosave.flush();
      // Si todavia hay pendientes, el flush fallo y abortamos.
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
    return <p className="text-sm text-muted-foreground">Cargando orden...</p>;
  }
  if (!order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/ordenes">
            <ArrowLeft className="h-4 w-4" /> Volver
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
  const statusMeta = STATUS_META[autosave.status];
  const StatusIcon = statusMeta.icon;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to={`/admin/ordenes/${order.code}`} aria-label="Volver al detalle">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold">Captura de resultados</h1>
              <Badge variant={meta.variant}>{meta.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono">{order.code}</span> ·{' '}
              {order.patient.lastName}, {order.patient.firstName} ·{' '}
              <span className="font-mono text-xs">{order.patient.documentNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${statusMeta.className}`}>
            <StatusIcon
              className={`h-4 w-4 ${autosave.status === 'saving' ? 'animate-spin' : ''}`}
            />
            <span>{statusMeta.label}</span>
            {autosave.lastSavedAt && autosave.status !== 'saving' && (
              <span className="text-muted-foreground">
                · {formatDateTime(new Date(autosave.lastSavedAt))}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void handleSaveNow()}
            disabled={!editable || !autosave.hasPending || autosave.status === 'saving'}
          >
            <Save className="h-4 w-4" /> Guardar ahora
          </Button>
          <Button
            size="sm"
            onClick={() => void handleValidate()}
            disabled={!allFilled || !editable || validateMut.isPending}
          >
            <ClipboardCheck className="h-4 w-4" />
            {validateMut.isPending ? 'Validando...' : 'Validar orden'}
          </Button>
        </div>
      </div>

      {!editable && (
        <div className="rounded-md border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          La orden esta en estado &quot;{meta.label.toLowerCase()}&quot;: los resultados son solo de
          lectura.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Pruebas de la orden
            <Badge variant="muted" className="font-normal">
              {itemsWithResult}/{total} con resultado
            </Badge>
            {tests.isLoading && (
              <span className="text-xs text-muted-foreground">cargando opciones...</span>
            )}
          </CardTitle>
          <CardDescription>
            Los cambios se guardan automaticamente cada 10 s o cuando pulses &quot;Guardar ahora&quot;.
            El flag (normal / alto / bajo / critico) se recalcula en el servidor con cada save.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="p-3 text-left w-[110px]">Codigo</th>
                  <th className="p-3 text-left">Prueba</th>
                  <th className="p-3 text-left w-[200px]">Valor</th>
                  <th className="p-3 text-left w-[110px]">Flag</th>
                  <th className="p-3 text-left">Observacion</th>
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
                    <td colSpan={5} className="p-8 text-center text-sm text-muted-foreground">
                      La orden no tiene pruebas todavia.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {!allFilled && total > 0 && (
        <p className="text-xs text-muted-foreground">
          Faltan {total - itemsWithResult} {total - itemsWithResult === 1 ? 'prueba' : 'pruebas'}{' '}
          por completar antes de poder validar.
        </p>
      )}
    </div>
  );
}
