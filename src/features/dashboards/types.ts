import type { OrderState } from '@features/orders/types';

// Espejo del DashboardOverview del backend
// (lab-backend/src/modules/dashboards/dashboards.service.ts).
export interface DashboardOverview {
  ordersByState: Record<OrderState, number>;
  totalsToday: { orders: number; results: number; deliveries: number };
  totalsLast7d: { orders: number; results: number; deliveries: number };
  totalsLast30d: { orders: number; results: number; deliveries: number };
  pendingValidation: number;
  criticalsLast7d: number;
  newPatientsLast30d: number;
  topTests: Array<{ testId: string; code: string; name: string; count: number }>;
  topReferences: Array<{ referenceId: string; name: string; count: number }>;
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  created: number;
  delivered: number;
}
