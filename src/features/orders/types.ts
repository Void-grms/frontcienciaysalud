export type OrderState =
  | 'draft'
  | 'in_progress'
  | 'validated'
  | 'delivered'
  | 'amended'
  | 'cancelled';

export type ResultFlag = 'normal' | 'high' | 'low' | 'critical' | 'unknown';

export type ResultType = 'numeric' | 'text' | 'qualitative' | 'observation';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// ---- Lectura ----

export interface OrderListPatient {
  id: string;
  firstName: string;
  lastName: string;
  documentNumber: string;
}

export interface OrderListReference {
  id: string;
  name: string;
}

export interface OrderListItem {
  id: string;
  code: string;
  state: OrderState;
  patientId: string;
  patient: OrderListPatient;
  referenceId: string | null;
  reference: OrderListReference | null;
  requestingDoctor: string | null;
  sampleTakenAt: string | null;
  createdAt: string;
  validatedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  stateReason: string | null;
  _count?: { items: number; results: number };
}

export interface OrderItemTestSummary {
  id: string;
  code: string;
  name: string;
  unit: string | null;
  resultType: ResultType;
  categoryId: string;
  decimals: number;
}

export interface OrderItemPanelSummary {
  id: string;
  code: string;
  name: string;
}

export interface OrderItemResult {
  id: string;
  valueNumeric: string | null;
  valueText: string | null;
  flag: ResultFlag | null;
  observation: string | null;
  enteredAt: string;
}

export interface OrderItem {
  id: string;
  testId: string;
  testVersion: number;
  panelId: string | null;
  displayOrder: number;
  test: OrderItemTestSummary;
  panel: OrderItemPanelSummary | null;
  result: OrderItemResult | null;
}

export interface OrderDetailPatient {
  id: string;
  documentType: 'DNI' | 'CE' | 'PAS';
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  sex: 'M' | 'F' | 'A' | null;
  email: string | null;
  phone: string | null;
}

export interface OrderDetail {
  id: string;
  code: string;
  state: OrderState;
  patientId: string;
  patient: OrderDetailPatient;
  referenceId: string | null;
  reference: { id: string; name: string; taxId: string | null } | null;
  requestingDoctor: string | null;
  clinicalInfo: string | null;
  sampleTakenAt: string | null;
  createdAt: string;
  validatedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  stateReason: string | null;
  previousOrderId: string | null;
  createdBy: { id: string; fullName: string | null; email: string | null } | null;
  validatedBy: { id: string; fullName: string | null; email: string | null } | null;
  items: OrderItem[];
}

// ---- Filtros / lista ----

export interface OrderListParams {
  state?: OrderState;
  from?: string;
  to?: string;
  patientId?: string;
  referenceId?: string;
  code?: string;
  search?: string;
  page?: number;
  perPage?: number;
}

// ---- Mutaciones ----

export interface OrderCreateInput {
  patientId: string;
  referenceId?: string;
  requestingDoctor?: string;
  clinicalInfo?: string;
  sampleTakenAt?: string;
  tests?: Array<{ testId: string; panelId?: string }>;
  panels?: Array<{ panelId: string }>;
}

export interface OrderUpdateInput {
  referenceId?: string | null;
  requestingDoctor?: string;
  clinicalInfo?: string;
  sampleTakenAt?: string;
}

export interface AddOrderItemInput {
  testId?: string;
  panelId?: string;
}

export interface CancelOrderInput {
  reason: string;
}

export interface AmendOrderInput {
  reason: string;
}
