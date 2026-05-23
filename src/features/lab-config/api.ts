import { api } from '@shared/api/client';

import type { LabConfig, LabConfigUpdateInput } from './types';

const MULTIPART_HEADERS = { 'Content-Type': undefined as unknown as string };

export const labConfigApi = {
  async get(): Promise<LabConfig> {
    const { data } = await api.get<LabConfig>('/lab-config');
    return data;
  },

  async update(input: LabConfigUpdateInput): Promise<LabConfig> {
    const { data } = await api.put<LabConfig>('/lab-config', input);
    return data;
  },

  async updateLogo(file: File): Promise<LabConfig> {
    const form = new FormData();
    form.append('logo', file);
    const { data } = await api.put<LabConfig>('/lab-config/logo', form, {
      headers: MULTIPART_HEADERS,
    });
    return data;
  },
};
