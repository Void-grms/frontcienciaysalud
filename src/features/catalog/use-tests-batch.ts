import { useQueries } from '@tanstack/react-query';

import { catalogApi } from './api';
import { catalogKeys } from './hooks';
import type { Test } from './types';

// Carga N tests en paralelo y devuelve un Map<id, Test>. Lo usamos en la
// captura de resultados para obtener las `options` de las pruebas
// cualitativas sin reimplementar el endpoint en batch. React Query cachea
// cada test individual, asi que reentrar a la pagina no reconsulta.
export function useTestsBatch(testIds: string[]): {
  byId: Map<string, Test>;
  isLoading: boolean;
} {
  const queries = useQueries({
    queries: testIds.map((id) => ({
      queryKey: catalogKeys.tests.detail(id),
      queryFn: () => catalogApi.getTest(id),
      staleTime: 60_000,
    })),
  });

  const byId = new Map<string, Test>();
  for (const q of queries) {
    if (q.data) byId.set(q.data.id, q.data);
  }
  return { byId, isLoading: queries.some((q) => q.isLoading) };
}
