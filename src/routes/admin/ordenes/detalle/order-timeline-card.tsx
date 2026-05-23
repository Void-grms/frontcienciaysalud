import { CalendarClock, Check, FileCheck, Send, XCircle } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import { formatDateTime } from '@shared/lib/format-date';

import type { OrderDetail } from '@features/orders/types';

interface TimelineEvent {
  icon: typeof CalendarClock;
  label: string;
  at: string | null;
  by?: string | null;
  reason?: string | null;
}

// Reconstruimos un timeline simple a partir de los timestamps del propio detail
// (no exponemos el OrderEvent table en el endpoint actual). Aprovechamos
// `createdAt`, `validatedAt`, `deliveredAt`, `cancelledAt` y `stateReason`.
interface OrderTimelineCardProps {
  order: OrderDetail;
}

export function OrderTimelineCard({ order }: OrderTimelineCardProps) {
  const events: TimelineEvent[] = [
    {
      icon: CalendarClock,
      label: 'Orden creada',
      at: order.createdAt,
      by: order.createdBy?.fullName ?? order.createdBy?.email ?? null,
    },
    ...(order.validatedAt
      ? [
          {
            icon: FileCheck,
            label: 'Validada',
            at: order.validatedAt,
            by: order.validatedBy?.fullName ?? order.validatedBy?.email ?? null,
          },
        ]
      : []),
    ...(order.deliveredAt
      ? [{ icon: Send, label: 'Entregada al paciente', at: order.deliveredAt }]
      : []),
    ...(order.cancelledAt
      ? [
          {
            icon: XCircle,
            label: 'Anulada',
            at: order.cancelledAt,
            reason: order.stateReason,
          },
        ]
      : []),
    ...(order.state === 'amended'
      ? [
          {
            icon: Check,
            label: 'Reemplazada por una enmienda',
            at: null,
            reason: order.stateReason,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial</CardTitle>
        <CardDescription>Eventos principales de la orden.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {events.map((e, idx) => {
            const Icon = e.icon;
            return (
              <li key={idx} className="flex gap-3">
                <div className="mt-0.5 rounded-full border bg-muted p-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{e.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {e.at ? formatDateTime(e.at) : 'sin fecha'}
                    {e.by ? ` · ${e.by}` : ''}
                  </div>
                  {e.reason && (
                    <div className="mt-1 rounded border bg-muted/40 px-2 py-1 text-xs italic">
                      {e.reason}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
