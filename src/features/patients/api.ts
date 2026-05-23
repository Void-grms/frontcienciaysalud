import { api } from '@shared/api/client';

import type {
  Paginated,
  Patient,
  PatientCreateInput,
  PatientListParams,
  PatientUpdateInput,
  PortalAccessResponse,
} from './types';

export const patientsApi = {
  async list(params: PatientListParams = {}): Promise<Paginated<Patient>> {
    const { data } = await api.get<Paginated<Patient>>('/patients', { params });
    return data;
  },

  async get(id: string): Promise<Patient> {
    const { data } = await api.get<Patient>(`/patients/${id}`);
    return data;
  },

  async create(input: PatientCreateInput): Promise<Patient> {
    const { data } = await api.post<Patient>('/patients', input);
    return data;
  },

  async update(id: string, input: PatientUpdateInput): Promise<Patient> {
    const { data } = await api.patch<Patient>(`/patients/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },

  async grantPortalAccess(id: string): Promise<PortalAccessResponse> {
    const { data } = await api.post<PortalAccessResponse>(`/patients/${id}/portal-access`);
    return data;
  },
};
