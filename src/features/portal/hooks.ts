import { useQuery } from '@tanstack/react-query';

import type { OrderListParams } from '@features/orders/types';

import { patientPortalApi, referencePortalApi } from './api';
import type { DerivedPatientsParams } from './types';

export const portalKeys = {
  patient: {
    orders: (params: OrderListParams) => ['portal', 'patient', 'orders', params] as const,
    order: (idOrCode: string) => ['portal', 'patient', 'order', idOrCode] as const,
  },
  reference: {
    orders: (params: OrderListParams) => ['portal', 'reference', 'orders', params] as const,
    order: (idOrCode: string) => ['portal', 'reference', 'order', idOrCode] as const,
    patients: (params: DerivedPatientsParams) =>
      ['portal', 'reference', 'patients', params] as const,
  },
};

// ---------- Paciente ----------

export function usePatientOrders(params: OrderListParams) {
  return useQuery({
    queryKey: portalKeys.patient.orders(params),
    queryFn: () => patientPortalApi.listOrders(params),
  });
}

export function usePatientOrder(idOrCode: string | null) {
  return useQuery({
    queryKey: portalKeys.patient.order(idOrCode ?? ''),
    queryFn: () => patientPortalApi.getOrder(idOrCode as string),
    enabled: Boolean(idOrCode),
  });
}

// ---------- Referencia ----------

export function useReferenceOrders(params: OrderListParams) {
  return useQuery({
    queryKey: portalKeys.reference.orders(params),
    queryFn: () => referencePortalApi.listOrders(params),
  });
}

export function useReferenceOrder(idOrCode: string | null) {
  return useQuery({
    queryKey: portalKeys.reference.order(idOrCode ?? ''),
    queryFn: () => referencePortalApi.getOrder(idOrCode as string),
    enabled: Boolean(idOrCode),
  });
}

export function useReferencePatients(params: DerivedPatientsParams) {
  return useQuery({
    queryKey: portalKeys.reference.patients(params),
    queryFn: () => referencePortalApi.listPatients(params),
  });
}
