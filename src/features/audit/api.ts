import { api } from '@shared/api/client';

import type { AuditEntry, AuditListParams, Paginated } from './types';

export const auditApi = {
  async list(params: AuditListParams): Promise<Paginated<AuditEntry>> {
    const { data } = await api.get<Paginated<AuditEntry>>('/audit', { params });
    return data;
  },
};
