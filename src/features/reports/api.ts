import { api } from '@shared/api/client';

import type {
  ReportRegenerateResponse,
  ReportVersion,
  VerifyResponse,
} from './types';

export const reportsApi = {
  // Devuelve el PDF como Blob. El controller produce inline (Content-Disposition
  // sin attachment) para que el visor del browser pueda renderizarlo, pero
  // nosotros tambien soportamos descargarlo via downloadBlob.
  async downloadPdf(orderId: string): Promise<{ blob: Blob; filename: string }> {
    const response = await api.get<Blob>(`/orders/${orderId}/report.pdf`, {
      responseType: 'blob',
    });
    // Intentamos extraer el filename del Content-Disposition; si no, usamos
    // un fallback razonable.
    const cd = response.headers['content-disposition'] as string | undefined;
    const match = cd?.match(/filename="?([^";]+)"?/);
    const filename = match?.[1] ?? `informe-${orderId}.pdf`;
    return { blob: response.data, filename };
  },

  async regenerate(orderId: string): Promise<ReportRegenerateResponse> {
    const { data } = await api.post<ReportRegenerateResponse>(
      `/orders/${orderId}/report/regenerate`,
    );
    return data;
  },

  async listVersions(orderId: string): Promise<ReportVersion[]> {
    const { data } = await api.get<ReportVersion[]>(`/orders/${orderId}/reports`);
    return data;
  },

  // Endpoint publico (sin auth).
  async verify(token: string): Promise<VerifyResponse> {
    const { data } = await api.get<VerifyResponse>(`/verify/${token}`);
    return data;
  },
};
