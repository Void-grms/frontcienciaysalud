// Distribucion de ordenes por estado: total grande + barra horizontal apilada
// + listado clickeable por estado. Reutiliza STATE_META para mantener
// consistencia con el resto de la app.

import { STATE_META } from '@features/orders/state-meta';
import type { OrderState } from '@features/orders/types';

const STATE_ORDER: OrderState[] = [
  'draft',
  'in_progress',
  'validated',
  'delivered',
  'amended',
  'cancelled',
];

// Variant -> clase de fondo para el segmento de la barra apilada.
const VARIANT_BG: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground/60',
  default: 'bg-primary',
  secondary: 'bg-secondary-foreground/40',
  outline: 'bg-foreground/40',
};

interface StateDistributionProps {
  data: Record<OrderState, number>;
}

export function StateDistribution({ data }: StateDistributionProps) {
  const total = STATE_ORDER.reduce((acc, s) => acc + (data[s] ?? 0), 0);
  if (total === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        No hay ordenes registradas aun.
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {/* Total grande arriba */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</div>
        <div className="mt-0.5 text-2xl font-semibold tabular-nums leading-none">{total}</div>
      </div>

      {/* Barra horizontal apilada */}
      <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted">
        {STATE_ORDER.map((s) => {
          const count = data[s] ?? 0;
          if (count === 0) return null;
          const meta = STATE_META[s];
          const bg = VARIANT_BG[meta.variant] ?? 'bg-primary';
          const pct = (count / total) * 100;
          return (
            <div
              key={s}
              className={bg}
              style={{ width: `${pct}%` }}
              title={`${meta.label}: ${count} (${pct.toFixed(1)}%)`}
            />
          );
        })}
      </div>

      {/* Leyenda compacta */}
      <ul className="space-y-1.5">
        {STATE_ORDER.map((s) => {
          const count = data[s] ?? 0;
          const meta = STATE_META[s];
          const bg = VARIANT_BG[meta.variant] ?? 'bg-primary';
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <li
              key={s}
              className="flex items-center gap-2.5 text-xs"
              data-zero={count === 0 || undefined}
            >
              <span className={`size-2 shrink-0 rounded-sm ${bg} data-[zero]:opacity-30`} />
              <span className="flex-1 truncate text-muted-foreground data-[zero]:opacity-50">
                {meta.label}
              </span>
              <span className="font-medium tabular-nums">{count}</span>
              <span className="w-10 text-right text-[10px] text-muted-foreground tabular-nums">
                {count > 0 ? `${pct.toFixed(0)}%` : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
