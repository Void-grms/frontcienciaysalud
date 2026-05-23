import { useQuery } from '@tanstack/react-query';

import { dashboardsApi } from './api';

export const dashboardsKeys = {
  overview: ['dashboards', 'overview'] as const,
  timeline: (days: number) => ['dashboards', 'timeline', days] as const,
};

// staleTime alto (60s) porque los KPIs no cambian al ritmo de cada click; el
// usuario puede forzar refetch con el boton "Actualizar".
export function useDashboardOverview() {
  return useQuery({
    queryKey: dashboardsKeys.overview,
    queryFn: () => dashboardsApi.overview(),
    staleTime: 60_000,
  });
}

export function useDashboardTimeline(days: number) {
  return useQuery({
    queryKey: dashboardsKeys.timeline(days),
    queryFn: () => dashboardsApi.timeline(days),
    staleTime: 60_000,
  });
}
