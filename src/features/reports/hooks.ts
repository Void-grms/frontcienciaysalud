import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { reportsApi } from './api';

export const reportsKeys = {
  all: ['reports'] as const,
  versions: (orderId: string) => ['reports', 'versions', orderId] as const,
  verify: (token: string) => ['reports', 'verify', token] as const,
};

export function useReportVersions(orderId: string | null) {
  return useQuery({
    queryKey: reportsKeys.versions(orderId ?? ''),
    queryFn: () => reportsApi.listVersions(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useRegenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => reportsApi.regenerate(orderId),
    onSuccess: (_, orderId) => {
      void qc.invalidateQueries({ queryKey: reportsKeys.versions(orderId) });
    },
  });
}

// Verify usa el endpoint publico y NO requiere staleTime alto: el token vive
// para siempre (a menos que el laboratorio lo revoque) y el contenido cambia
// solo si se enmienda la orden.
export function useVerifyReport(token: string | null) {
  return useQuery({
    queryKey: reportsKeys.verify(token ?? ''),
    queryFn: () => reportsApi.verify(token as string),
    enabled: Boolean(token),
    retry: false,
  });
}
