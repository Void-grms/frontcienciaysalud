// Barra horizontal apilada que muestra la distribucion de ordenes por estado.
// Reutiliza los colores/labels de STATE_META para mantener consistencia con
// el resto de la app.

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

// Mapeo de variants de Badge a clases de fondo para el fragmento de barra.
const VARIANT_BG: Record<string, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  destructive: 'bg-destructive',
  muted: 'bg-muted-foreground',
  default: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'bg-foreground/40',
};

interface StateDistributionProps {
  data: Record<OrderState, number>;
}

export function StateDistribution({ data }: StateDistributionProps) {
  const total = STATE_ORDER.reduce((acc, s) => acc + (data[s] ?? 0), 0);
  if (total === 0) {
    return (
      <p className="text-sm text-muted-foreground">No hay ordenes registradas aun.</p>
    );
  }
  return (
    <div className="space-y-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full border bg-muted">
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
      <ul className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        {STATE_ORDER.map((s) => {
          const count = data[s] ?? 0;
          const meta = STATE_META[s];
          const bg = VARIANT_BG[meta.variant] ?? 'bg-primary';
          return (
            <li key={s} className="flex items-center gap-2">
              <span className={`inline-block h-2 w-2 rounded-sm ${bg}`} />
              <span className="text-muted-foreground">{meta.label}</span>
              <span className="ml-auto font-medium tabular-nums">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
