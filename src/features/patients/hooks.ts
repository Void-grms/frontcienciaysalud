import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { patientsApi } from './api';
import type {
  PatientCreateInput,
  PatientListParams,
  PatientUpdateInput,
} from './types';

export const patientsKeys = {
  all: ['patients'] as const,
  list: (params: PatientListParams) => ['patients', 'list', params] as const,
  detail: (id: string) => ['patients', 'detail', id] as const,
};

export function usePatientsList(params: PatientListParams) {
  return useQuery({
    queryKey: patientsKeys.list(params),
    queryFn: () => patientsApi.list(params),
  });
}

export function usePatientDetail(id: string | null) {
  return useQuery({
    queryKey: patientsKeys.detail(id ?? ''),
    queryFn: () => patientsApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientCreateInput) => patientsApi.create(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: patientsKeys.all });
    },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PatientUpdateInput }) =>
      patientsApi.update(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: patientsKeys.all });
      void qc.invalidateQueries({ queryKey: patientsKeys.detail(variables.id) });
    },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsApi.remove(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: patientsKeys.all });
    },
  });
}

export function useGrantPortalAccess() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsApi.grantPortalAccess(id),
    onSuccess: (_, id) => {
      void qc.invalidateQueries({ queryKey: patientsKeys.detail(id) });
    },
  });
}
