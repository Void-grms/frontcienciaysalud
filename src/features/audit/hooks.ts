import { useQuery } from '@tanstack/react-query';

import { auditApi } from './api';
import type { AuditListParams } from './types';

export const auditKeys = {
  list: (params: AuditListParams) => ['audit', 'list', params] as const,
};

export function useAuditList(params: AuditListParams) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditApi.list(params),
  });
}
