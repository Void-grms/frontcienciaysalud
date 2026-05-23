import type { OrderState } from './types';

// Etiquetas + variantes de badge compartidas entre lista y detalle. Tabla
// canonica para que ambos vean lo mismo y no diverjan textos.
export const STATE_META: Record<
  OrderState,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'muted' | 'destructive' }
> = {
  draft: { label: 'Borrador', variant: 'muted' },
  in_progress: { label: 'En proceso', variant: 'warning' },
  validated: { label: 'Validada', variant: 'default' },
  delivered: { label: 'Entregada', variant: 'success' },
  amended: { label: 'Enmendada', variant: 'secondary' },
  cancelled: { label: 'Anulada', variant: 'destructive' },
};

// Tabla de transiciones permitidas (mirror del backend en order-state.ts).
// La UI solo la usa para mostrar/ocultar botones; el backend es la fuente de
// verdad y rechaza con 409 si llega una transicion no listada.
export function canTransitionTo(from: OrderState, to: OrderState): boolean {
  const allowed: Record<OrderState, OrderState[]> = {
    draft: ['in_progress', 'cancelled'],
    in_progress: ['validated', 'draft', 'cancelled'],
    validated: ['delivered', 'cancelled'],
    delivered: ['amended'],
    amended: [],
    cancelled: [],
  };
  return allowed[from].includes(to);
}

export function canEditMetadata(state: OrderState): boolean {
  return state === 'draft' || state === 'in_progress';
}

export function canEditItems(state: OrderState): boolean {
  return state === 'draft' || state === 'in_progress';
}
