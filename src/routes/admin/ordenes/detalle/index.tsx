import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  FileSpreadsheet,
  Info,
  Loader2,
  Plus,
  RefreshCcw,
  Send,
  User,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { formatDate, formatDateTime } from '@shared/lib/format-date';
import { reportFormError } from '@shared/lib/report-error';

import {
  useAmendOrder,
  useCancelOrder,
  useDeliverOrder,
  useOrderDetail,
  useValidateOrder,
} from '@features/orders/hooks';
import { STATE_META, canEditItems, canTransitionTo } from '@features/orders/state-meta';

import { AddItemsDialog } from './add-items-dialog';
import { OrderItemsCard } from './order-items-card';
import { OrderMetadataCard } from './order-metadata-card';
import { OrderReportCard } from './order-report-card';
import { OrderTimelineCard } from './order-timeline-card';
import { ReasonDialog } from './reason-dialog';

function ageFromBirthDate(birthDate: string | null): string {
  if (!birthDate) return '—';
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return '—';
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return `${age} anos`;
}

function patientInitials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?';
}

function sexLabel(sex: string | null | undefined): string {
  if (sex === 'M') return 'Masculino';
  if (sex === 'F') return 'Femenino';
  if (sex === 'A') return 'Ambiguo';
  return '—';
}

export default function OrdenDetailPage() {
  const { idOrCode } = useParams<{ idOrCode: string }>();
  const navigate = useNavigate();
  const query = useOrderDetail(idOrCode ?? null);

  const [addItemsOpen, setAddItemsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);

  const validateMut = useValidateOrder();
  const deliverMut = useDeliverOrder();
  const cancelMut = useCancelOrder();
  const amendMut = useAmendOrder();

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
          <Link to="/admin/ordenes">
            <ArrowLeft /> Volver a ordenes
          </Link>
        </Button>
        <p className="text-sm text-destructive">No se pudo cargar la orden.</p>
      </div>
    );
  }

  const order = query.data;
  const meta = STATE_META[order.state];

  const handleValidate = async () => {
    try {
      await validateMut.mutateAsync(order.id);
      toast.success('Orden validada');
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleDeliver = async () => {
    try {
      await deliverMut.mutateAsync(order.id);
      toast.success('Orden marcada como entregada. Notificacion enviada.');
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleCancel = async (reason: string) => {
    try {
      await cancelMut.mutateAsync({ id: order.id, input: { reason } });
      toast.success('Orden anulada');
      setCancelOpen(false);
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleAmend = async (reason: string) => {
    try {
      const amended = await amendMut.mutateAsync({ id: order.id, input: { reason } });
      toast.success(`Enmienda ${amended.code} creada en borrador`);
      setAmendOpen(false);
      navigate(`/admin/ordenes/${amended.code}`);
    } catch (err) {
      reportFormError(err);
    }
  };

  const canValidate = canTransitionTo(order.state, 'validated');
  const canDeliver = canTransitionTo(order.state, 'delivered');
  const canCancel = canTransitionTo(order.state, 'cancelled');
  const canAmend = canTransitionTo(order.state, 'amended');
  const itemsEditable = canEditItems(order.state);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/admin/ordenes">
          <ArrowLeft /> Volver a ordenes
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
            Creada {formatDateTime(order.createdAt)}
            {order.createdBy?.fullName && (
              <>
                <span className="mx-2 text-border">·</span>
                por {order.createdBy.fullName}
              </>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/admin/ordenes/${order.code}/resultados`}>
              <FileSpreadsheet /> Capturar resultados
            </Link>
          </Button>
          {itemsEditable && (
            <Button variant="outline" size="sm" onClick={() => setAddItemsOpen(true)}>
              <Plus /> Agregar pruebas
            </Button>
          )}
          {canValidate && (
            <Button
              size="sm"
              onClick={() => void handleValidate()}
              disabled={validateMut.isPending}
            >
              {validateMut.isPending ? <Loader2 className="animate-spin" /> : <ClipboardCheck />}
              {validateMut.isPending ? 'Validando...' : 'Validar'}
            </Button>
          )}
          {canDeliver && (
            <Button
              size="sm"
              onClick={() => void handleDeliver()}
              disabled={deliverMut.isPending}
            >
              {deliverMut.isPending ? <Loader2 className="animate-spin" /> : <Send />}
              {deliverMut.isPending ? 'Entregando...' : 'Entregar'}
            </Button>
          )}
          {canAmend && (
            <Button variant="outline" size="sm" onClick={() => setAmendOpen(true)}>
              <RefreshCcw /> Enmendar
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              <XCircle className="text-destructive" /> Anular
            </Button>
          )}
        </div>
      </div>

      {/* Banner de enmienda */}
      {order.previousOrderId && (
        <div className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 text-sm">
          <Info className="mt-0.5 size-4 shrink-0 text-warning-foreground" aria-hidden />
          <div>
            <p className="font-medium text-warning-foreground">Orden enmendada</p>
            <p className="mt-0.5 text-xs text-warning-foreground/80">
              Esta orden es una enmienda de una orden anterior. Los resultados originales fueron
              copiados al crearse; puedes ajustarlos antes de validar.
            </p>
          </div>
        </div>
      )}

      {/* Grid de contenido */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Tarjeta del paciente */}
        <Card className="lg:col-span-1">
          <CardContent className="p-5 sm:p-6">
            {/* Header con avatar */}
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
                    {ageFromBirthDate(order.patient.birthDate)}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Sexo
                  </dt>
                  <dd className="mt-0.5">{sexLabel(order.patient.sex)}</dd>
                </div>
                {order.patient.email && (
                  <div className="col-span-2">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Email
                    </dt>
                    <dd className="mt-0.5 truncate text-xs">{order.patient.email}</dd>
                  </div>
                )}
                {order.patient.phone && (
                  <div className="col-span-2">
                    <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Telefono
                    </dt>
                    <dd className="mt-0.5 tabular-nums">{order.patient.phone}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="mt-5 border-t border-border pt-4">
              <Button asChild variant="ghost" size="sm" className="-ml-2 text-primary hover:text-primary-700">
                <Link to={`/admin/pacientes?focus=${order.patient.id}`}>
                  Ver ficha completa →
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5 lg:col-span-2">
          <OrderMetadataCard order={order} />
          <OrderItemsCard order={order} />
          <OrderReportCard order={order} />
        </div>
      </div>

      <OrderTimelineCard order={order} />

      <AddItemsDialog orderId={order.id} open={addItemsOpen} onOpenChange={setAddItemsOpen} />

      <ReasonDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Anular orden"
        description={`La orden ${order.code} pasara a estado anulada. Esta accion no se puede revertir.`}
        confirmLabel="Anular orden"
        confirmVariant="destructive"
        onConfirm={handleCancel}
        loading={cancelMut.isPending}
      />
      <ReasonDialog
        open={amendOpen}
        onOpenChange={setAmendOpen}
        title="Enmendar orden"
        description={`Se creara una nueva orden en borrador con los items y resultados de ${order.code}, y la actual quedara marcada como enmendada.`}
        confirmLabel="Crear enmienda"
        onConfirm={handleAmend}
        loading={amendMut.isPending}
      />
    </div>
  );
}
