import { api } from '@shared/api/client';

import type {
  Paginated,
  Professional,
  ProfessionalCreateInput,
  ProfessionalListParams,
  ProfessionalUpdateInput,
} from './types';

// El header default de Axios es application/json; en multipart hay que
// limpiarlo para que el navegador/Node compute el boundary correcto.
const MULTIPART_HEADERS = { 'Content-Type': undefined as unknown as string };

export const professionalsApi = {
  async list(params: ProfessionalListParams = {}): Promise<Paginated<Professional>> {
    const { data } = await api.get<Paginated<Professional>>('/professionals', { params });
    return data;
  },

  async get(id: string): Promise<Professional> {
    const { data } = await api.get<Professional>(`/professionals/${id}`);
    return data;
  },

  async create(input: ProfessionalCreateInput): Promise<Professional> {
    const form = new FormData();
    form.append('fullName', input.fullName);
    if (input.professionalTitle) form.append('professionalTitle', input.professionalTitle);
    if (input.licenseNumber) form.append('licenseNumber', input.licenseNumber);
    if (input.signature) form.append('signature', input.signature);

    const { data } = await api.post<Professional>('/professionals', form, {
      headers: MULTIPART_HEADERS,
    });
    return data;
  },

  async update(id: string, input: ProfessionalUpdateInput): Promise<Professional> {
    const { data } = await api.patch<Professional>(`/professionals/${id}`, input);
    return data;
  },

  async updateSignature(id: string, signature: File): Promise<Professional> {
    const form = new FormData();
    form.append('signature', signature);
    const { data } = await api.patch<Professional>(`/professionals/${id}/signature`, form, {
      headers: MULTIPART_HEADERS,
    });
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/professionals/${id}`);
  },
};
