import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ordersKeys } from '@features/orders/hooks';

import { resultsApi } from './api';
import type { BulkSaveInput } from './types';

export const resultsKeys = {
  all: ['results'] as const,
  list: (orderId: string) => ['results', 'list', orderId] as const,
};

export function useResultsList(orderId: string | null) {
  return useQuery({
    queryKey: resultsKeys.list(orderId ?? ''),
    queryFn: () => resultsApi.list(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useBulkSaveResults() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, input }: { orderId: string; input: BulkSaveInput }) =>
      resultsApi.bulkSave(orderId, input),
    onSuccess: (_, variables) => {
      // El bulk-save puede haber movido la orden de draft a in_progress y
      // actualizado flags/rangos, asi que invalidamos ambos caches.
      void qc.invalidateQueries({ queryKey: resultsKeys.list(variables.orderId) });
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}
