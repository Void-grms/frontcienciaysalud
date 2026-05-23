import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { labConfigApi } from './api';
import type { LabConfigUpdateInput } from './types';

export const labConfigKeys = {
  all: ['lab-config'] as const,
  current: ['lab-config', 'current'] as const,
};

export function useLabConfig() {
  return useQuery({
    queryKey: labConfigKeys.current,
    queryFn: () => labConfigApi.get(),
    staleTime: 60_000,
  });
}

export function useUpdateLabConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LabConfigUpdateInput) => labConfigApi.update(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: labConfigKeys.all });
    },
  });
}

export function useUpdateLabLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => labConfigApi.updateLogo(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: labConfigKeys.all });
    },
  });
}
