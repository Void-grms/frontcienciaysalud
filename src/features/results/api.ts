import { api } from '@shared/api/client';

import type {
  BulkSaveInput,
  BulkSaveResponse,
  ResultWithRange,
  SetOneInput,
} from './types';

export const resultsApi = {
  async list(orderId: string): Promise<ResultWithRange[]> {
    const { data } = await api.get<ResultWithRange[]>(`/orders/${orderId}/results`);
    return data;
  },

  async bulkSave(orderId: string, input: BulkSaveInput): Promise<BulkSaveResponse> {
    const { data } = await api.post<BulkSaveResponse>(
      `/orders/${orderId}/results/bulk-save`,
      input,
    );
    return data;
  },

  async setOne(orderId: string, itemId: string, input: SetOneInput): Promise<ResultWithRange> {
    const { data } = await api.put<ResultWithRange>(
      `/orders/${orderId}/results/${itemId}`,
      input,
    );
    return data;
  },

  async setObservation(
    orderId: string,
    itemId: string,
    observation: string | null,
  ): Promise<ResultWithRange> {
    const { data } = await api.post<ResultWithRange>(
      `/orders/${orderId}/results/${itemId}/observation`,
      { observation },
    );
    return data;
  },
};
