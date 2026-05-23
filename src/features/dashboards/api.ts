import { api } from '@shared/api/client';

import type { DailyPoint, DashboardOverview } from './types';

export const dashboardsApi = {
  async overview(): Promise<DashboardOverview> {
    const { data } = await api.get<DashboardOverview>('/admin/dashboard/overview');
    return data;
  },

  async timeline(days: number): Promise<DailyPoint[]> {
    const { data } = await api.get<DailyPoint[]>('/admin/dashboard/timeline', {
      params: { days },
    });
    return data;
  },
};
