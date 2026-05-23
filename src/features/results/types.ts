import type { ResultFlag } from '@features/orders/types';

// Forma del resultado tal cual lo devuelve `GET /orders/:id/results`. Difiere
// del `OrderItem.result` embebido en el detail por incluir `appliedRange` y
// el `orderItem.displayOrder`.
export interface ResultWithRange {
  id: string;
  orderId: string;
  orderItemId: string;
  testId: string;
  valueNumeric: string | null; // Prisma.Decimal se serializa como string
  valueText: string | null;
  observation: string | null;
  flag: ResultFlag | null;
  appliedRangeId: string | null;
  appliedRange: AppliedRange | null;
  enteredAt: string;
  enteredByUserId: string | null;
  orderItem: {
    id: string;
    displayOrder: number;
    test: {
      id: string;
      code: string;
      name: string;
      unit: string | null;
      resultType: 'numeric' | 'text' | 'qualitative' | 'observation';
    };
  };
}

export interface AppliedRange {
  id: string;
  testId: string;
  sex: 'M' | 'F' | 'A' | null;
  ageMinDays: number | null;
  ageMaxDays: number | null;
  physiologicalState: string | null;
  valueMin: string | null;
  valueMax: string | null;
  qualitativeExpected: string | null;
  displayText: string | null;
  priority: number;
}

// Payload del bulk-save: el backend acepta `valueNumeric`/`valueText` como
// undefined (no toca), null (limpia) o numero/string. Modelamos los tres.
export interface BulkResultEntry {
  orderItemId: string;
  valueNumeric?: number | null;
  valueText?: string | null;
  observation?: string | null;
}

export interface BulkSaveInput {
  entries: BulkResultEntry[];
}

export interface BulkSaveResponse {
  saved: number;
  ignored: Array<{ orderItemId: string; reason: string }>;
  results: unknown[];
}

export interface SetOneInput {
  valueNumeric?: number | null;
  valueText?: string | null;
  observation?: string | null;
}
