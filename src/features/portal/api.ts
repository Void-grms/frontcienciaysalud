import { api } from '@shared/api/client';

import type {
  OrderDetail,
  OrderListItem,
  OrderListParams,
  Paginated,
} from '@features/orders/types';

import type { DerivedPatient, DerivedPatientsParams } from './types';

// Helper para extraer filename + blob del response de PDF (mismo patron
// que usamos para reports admin).
async function downloadPdf(path: string): Promise<{ blob: Blob; filename: string }> {
  const response = await api.get<Blob>(path, { responseType: 'blob' });
  const cd = response.headers['content-disposition'] as string | undefined;
  const match = cd?.match(/filename="?([^";]+)"?/);
  const filename = match?.[1] ?? 'informe.pdf';
  return { blob: response.data, filename };
}

// ---------- Portal Paciente: /me ----------

export const patientPortalApi = {
  async listOrders(params: OrderListParams = {}): Promise<Paginated<OrderListItem>> {
    const { data } = await api.get<Paginated<OrderListItem>>('/me/orders', { params });
    return data;
  },

  async getOrder(idOrCode: string): Promise<OrderDetail> {
    const { data } = await api.get<OrderDetail>(`/me/orders/${idOrCode}`);
    return data;
  },

  async downloadPdf(idOrCode: string): Promise<{ blob: Blob; filename: string }> {
    return downloadPdf(`/me/orders/${idOrCode}/report.pdf`);
  },
};

// ---------- Portal Referencia: /me/reference ----------

export const referencePortalApi = {
  async listOrders(params: OrderListParams = {}): Promise<Paginated<OrderListItem>> {
    const { data } = await api.get<Paginated<OrderListItem>>('/me/reference/orders', {
      params,
    });
    return data;
  },

  async getOrder(idOrCode: string): Promise<OrderDetail> {
    const { data } = await api.get<OrderDetail>(`/me/reference/orders/${idOrCode}`);
    return data;
  },

  async downloadPdf(idOrCode: string): Promise<{ blob: Blob; filename: string }> {
    return downloadPdf(`/me/reference/orders/${idOrCode}/report.pdf`);
  },

  async listPatients(params: DerivedPatientsParams = {}): Promise<Paginated<DerivedPatient>> {
    const { data } = await api.get<Paginated<DerivedPatient>>('/me/reference/patients', {
      params,
    });
    return data;
  },
};
