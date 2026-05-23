import { api } from '@shared/api/client';

import type {
  Paginated,
  Reference,
  ReferenceCreateInput,
  ReferenceListItem,
  ReferenceListParams,
  ReferenceUpdateInput,
  ReferenceUserCreateInput,
  ReferenceUserCreateResponse,
} from './types';

export const referencesApi = {
  async list(params: ReferenceListParams = {}): Promise<Paginated<ReferenceListItem>> {
    const { data } = await api.get<Paginated<ReferenceListItem>>('/references', { params });
    return data;
  },

  async get(id: string): Promise<Reference> {
    const { data } = await api.get<Reference>(`/references/${id}`);
    return data;
  },

  async create(input: ReferenceCreateInput): Promise<Reference> {
    const { data } = await api.post<Reference>('/references', input);
    return data;
  },

  async update(id: string, input: ReferenceUpdateInput): Promise<Reference> {
    const { data } = await api.patch<Reference>(`/references/${id}`, input);
    return data;
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/references/${id}`);
  },

  async addUser(
    referenceId: string,
    input: ReferenceUserCreateInput,
  ): Promise<ReferenceUserCreateResponse> {
    const { data } = await api.post<ReferenceUserCreateResponse>(
      `/references/${referenceId}/users`,
      input,
    );
    return data;
  },

  async removeUser(referenceId: string, userId: string): Promise<void> {
    await api.delete(`/references/${referenceId}/users/${userId}`);
  },
};
