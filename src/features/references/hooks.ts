import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { referencesApi } from './api';
import type {
  ReferenceCreateInput,
  ReferenceListParams,
  ReferenceUpdateInput,
  ReferenceUserCreateInput,
} from './types';

export const referencesKeys = {
  all: ['references'] as const,
  list: (params: ReferenceListParams) => ['references', 'list', params] as const,
  detail: (id: string) => ['references', 'detail', id] as const,
};

export function useReferencesList(params: ReferenceListParams) {
  return useQuery({
    queryKey: referencesKeys.list(params),
    queryFn: () => referencesApi.list(params),
  });
}

export function useReferenceDetail(id: string | null) {
  return useQuery({
    queryKey: referencesKeys.detail(id ?? ''),
    queryFn: () => referencesApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReferenceCreateInput) => referencesApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: referencesKeys.all });
    },
  });
}

export function useUpdateReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReferenceUpdateInput }) =>
      referencesApi.update(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: referencesKeys.all });
      void qc.invalidateQueries({ queryKey: referencesKeys.detail(variables.id) });
    },
  });
}

export function useDeleteReference() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => referencesApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: referencesKeys.all });
    },
  });
}

export function useAddReferenceUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      referenceId,
      input,
    }: {
      referenceId: string;
      input: ReferenceUserCreateInput;
    }) => referencesApi.addUser(referenceId, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: referencesKeys.detail(variables.referenceId) });
      void qc.invalidateQueries({ queryKey: referencesKeys.all });
    },
  });
}

export function useRemoveReferenceUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ referenceId, userId }: { referenceId: string; userId: string }) =>
      referencesApi.removeUser(referenceId, userId),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: referencesKeys.detail(variables.referenceId) });
      void qc.invalidateQueries({ queryKey: referencesKeys.all });
    },
  });
}
