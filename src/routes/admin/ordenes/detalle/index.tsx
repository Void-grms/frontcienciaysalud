import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardCheck,
  FileSpreadsheet,
  Plus,
  RefreshCcw,
  Send,
  XCircle,
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
  return `${age} anios`;
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
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Cargando orden...</p>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/ordenes">
            <ArrowLeft className="h-4 w-4" /> Volver
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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/admin/ordenes" aria-label="Volver">
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
              {order.createdBy?.fullName ? ` · ${order.createdBy.fullName}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to={`/admin/ordenes/${order.code}/resultados`}>
              <FileSpreadsheet className="h-4 w-4" /> Capturar resultados
            </Link>
          </Button>
          {itemsEditable && (
            <Button variant="outline" size="sm" onClick={() => setAddItemsOpen(true)}>
              <Plus className="h-4 w-4" /> Agregar pruebas
            </Button>
          )}
          {canValidate && (
            <Button
              size="sm"
              onClick={() => void handleValidate()}
              disabled={validateMut.isPending}
            >
              <ClipboardCheck className="h-4 w-4" />
              {validateMut.isPending ? 'Validando...' : 'Validar'}
            </Button>
          )}
          {canDeliver && (
            <Button
              size="sm"
              onClick={() => void handleDeliver()}
              disabled={deliverMut.isPending}
            >
              <Send className="h-4 w-4" />
              {deliverMut.isPending ? 'Entregando...' : 'Entregar'}
            </Button>
          )}
          {canAmend && (
            <Button variant="outline" size="sm" onClick={() => setAmendOpen(true)}>
              <RefreshCcw className="h-4 w-4" /> Enmendar
            </Button>
          )}
          {canCancel && (
            <Button variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              <XCircle className="h-4 w-4 text-destructive" /> Anular
            </Button>
          )}
        </div>
      </div>

      {order.previousOrderId && (
        <div className="rounded-md border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm">
          Esta orden es una enmienda de una orden anterior. Los resultados originales fueron
          copiados al crearse; puedes ajustarlos antes de validar.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
            <CardDescription>
              <Link
                to={`/admin/pacientes?focus=${order.patient.id}`}
                className="text-primary hover:underline"
              >
                Ver ficha completa
              </Link>
            </CardDescription>
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
                  <dd>{ageFromBirthDate(order.patient.birthDate)}</dd>
                </div>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Sexo</dt>
                <dd>
                  {order.patient.sex === 'M'
                    ? 'Masculino'
                    : order.patient.sex === 'F'
                      ? 'Femenino'
                      : order.patient.sex === 'A'
                        ? 'Ambiguo'
                        : '—'}
                </dd>
              </div>
              {order.patient.email && (
                <div>
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="truncate">{order.patient.email}</dd>
                </div>
              )}
              {order.patient.phone && (
                <div>
                  <dt className="text-xs text-muted-foreground">Telefono</dt>
                  <dd>{order.patient.phone}</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <OrderMetadataCard order={order} />
          <OrderItemsCard order={order} />
          <OrderReportCard order={order} />
        </div>
      </div>

      <OrderTimelineCard order={order} />

      <AddItemsDialog
        orderId={order.id}
        open={addItemsOpen}
        onOpenChange={setAddItemsOpen}
      />

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
