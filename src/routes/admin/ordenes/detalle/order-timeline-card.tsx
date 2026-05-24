import { CalendarClock, Check, Clock, FileCheck, Send, XCircle } from 'lucide-react';

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
  tone: 'default' | 'success' | 'warning' | 'destructive';
}

interface OrderTimelineCardProps {
  order: OrderDetail;
}

const TONE_BG: Record<TimelineEvent['tone'], string> = {
  default: 'bg-primary-50 text-primary-700 ring-primary-100',
  success: 'bg-success/10 text-success ring-success/20',
  warning: 'bg-warning/15 text-warning-foreground ring-warning/30',
  destructive: 'bg-destructive/10 text-destructive ring-destructive/20',
};

const TONE_LINE: Record<TimelineEvent['tone'], string> = {
  default: 'bg-primary-100',
  success: 'bg-success/30',
  warning: 'bg-warning/30',
  destructive: 'bg-destructive/30',
};

export function OrderTimelineCard({ order }: OrderTimelineCardProps) {
  const events: TimelineEvent[] = [
    {
      icon: CalendarClock,
      label: 'Orden creada',
      at: order.createdAt,
      by: order.createdBy?.fullName ?? order.createdBy?.email ?? null,
      tone: 'default',
    },
    ...(order.validatedAt
      ? [
          {
            icon: FileCheck,
            label: 'Validada',
            at: order.validatedAt,
            by: order.validatedBy?.fullName ?? order.validatedBy?.email ?? null,
            tone: 'success' as const,
          },
        ]
      : []),
    ...(order.deliveredAt
      ? [
          {
            icon: Send,
            label: 'Entregada al paciente',
            at: order.deliveredAt,
            tone: 'success' as const,
          },
        ]
      : []),
    ...(order.cancelledAt
      ? [
          {
            icon: XCircle,
            label: 'Anulada',
            at: order.cancelledAt,
            reason: order.stateReason,
            tone: 'destructive' as const,
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
            tone: 'warning' as const,
          },
        ]
      : []),
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-muted-foreground" />
          Historial
        </CardTitle>
        <CardDescription>Eventos principales de la orden.</CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-5">
          {events.map((e, idx) => {
            const Icon = e.icon;
            const isLast = idx === events.length - 1;
            return (
              <li key={idx} className="relative flex gap-3">
                {/* Linea vertical conectora */}
                {!isLast && (
                  <div
                    className={`absolute left-[15px] top-9 h-[calc(100%+0.5rem)] w-px ${TONE_LINE[e.tone]}`}
                    aria-hidden
                  />
                )}
                {/* Icono circular */}
                <div
                  className={`relative z-10 grid size-8 shrink-0 place-items-center rounded-full ring-1 ring-inset ${TONE_BG[e.tone]}`}
                  aria-hidden
                >
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <div className="text-sm font-medium leading-tight">{e.label}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
                    <span className="tabular-nums">
                      {e.at ? formatDateTime(e.at) : 'sin fecha'}
                    </span>
                    {e.by && (
                      <>
                        <span className="text-border">·</span>
                        <span>{e.by}</span>
                      </>
                    )}
                  </div>
                  {e.reason && (
                    <div className="mt-2 rounded-md border border-border bg-muted/40 px-2.5 py-1.5 text-xs italic text-muted-foreground">
                      “{e.reason}”
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
