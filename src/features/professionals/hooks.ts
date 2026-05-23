import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { professionalsApi } from './api';
import type {
  ProfessionalCreateInput,
  ProfessionalListParams,
  ProfessionalUpdateInput,
} from './types';

export const professionalsKeys = {
  all: ['professionals'] as const,
  list: (params: ProfessionalListParams) => ['professionals', 'list', params] as const,
  detail: (id: string) => ['professionals', 'detail', id] as const,
};

export function useProfessionalsList(params: ProfessionalListParams) {
  return useQuery({
    queryKey: professionalsKeys.list(params),
    queryFn: () => professionalsApi.list(params),
  });
}

export function useCreateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfessionalCreateInput) => professionalsApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: professionalsKeys.all });
    },
  });
}

export function useUpdateProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProfessionalUpdateInput }) =>
      professionalsApi.update(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: professionalsKeys.all });
      void qc.invalidateQueries({ queryKey: professionalsKeys.detail(variables.id) });
    },
  });
}

export function useUpdateSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) =>
      professionalsApi.updateSignature(id, file),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: professionalsKeys.all });
      void qc.invalidateQueries({ queryKey: professionalsKeys.detail(variables.id) });
    },
  });
}

export function useDeleteProfessional() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => professionalsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: professionalsKeys.all });
    },
  });
}
