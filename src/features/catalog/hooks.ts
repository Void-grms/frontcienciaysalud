import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { catalogApi } from './api';
import type {
  CategoryInput,
  CategoryListParams,
  PanelCreateInput,
  PanelListParams,
  PanelTestInput,
  PanelUpdateInput,
  ReferenceRangeInput,
  TestCreateInput,
  TestListParams,
  TestUpdateInput,
} from './types';

// Claves de cache estables. Anidamos los params para que listas con distintos
// filtros no se pisen entre si y mantengamos invalidaciones quirurgicas.
export const catalogKeys = {
  categories: {
    all: ['catalog', 'categories'] as const,
    list: (params: CategoryListParams) => ['catalog', 'categories', 'list', params] as const,
    detail: (id: string) => ['catalog', 'categories', 'detail', id] as const,
  },
  tests: {
    all: ['catalog', 'tests'] as const,
    list: (params: TestListParams) => ['catalog', 'tests', 'list', params] as const,
    detail: (id: string) => ['catalog', 'tests', 'detail', id] as const,
  },
  panels: {
    all: ['catalog', 'panels'] as const,
    list: (params: PanelListParams) => ['catalog', 'panels', 'list', params] as const,
    detail: (id: string) => ['catalog', 'panels', 'detail', id] as const,
  },
  ranges: {
    all: ['catalog', 'ranges'] as const,
    forTest: (testId: string) => ['catalog', 'ranges', 'test', testId] as const,
  },
};

// ---------- Categorias ----------

export function useCategoriesList(params: CategoryListParams) {
  return useQuery({
    queryKey: catalogKeys.categories.list(params),
    queryFn: () => catalogApi.listCategories(params),
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CategoryInput) => catalogApi.createCategory(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.categories.all });
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CategoryInput> }) =>
      catalogApi.updateCategory(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.categories.all });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.deleteCategory(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.categories.all });
    },
  });
}

// ---------- Pruebas ----------

export function useTestsList(params: TestListParams) {
  return useQuery({
    queryKey: catalogKeys.tests.list(params),
    queryFn: () => catalogApi.listTests(params),
  });
}

export function useTestDetail(id: string | null) {
  return useQuery({
    queryKey: catalogKeys.tests.detail(id ?? ''),
    queryFn: () => catalogApi.getTest(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TestCreateInput) => catalogApi.createTest(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.tests.all });
    },
  });
}

export function useUpdateTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TestUpdateInput }) =>
      catalogApi.updateTest(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: catalogKeys.tests.all });
      void qc.invalidateQueries({ queryKey: catalogKeys.tests.detail(variables.id) });
    },
  });
}

export function useDeleteTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.deleteTest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.tests.all });
    },
  });
}

// ---------- Rangos referenciales ----------

export function useTestRanges(testId: string | null) {
  return useQuery({
    queryKey: catalogKeys.ranges.forTest(testId ?? ''),
    queryFn: () => catalogApi.listTestRanges(testId as string),
    enabled: Boolean(testId),
  });
}

export function useCreateTestRange(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReferenceRangeInput) => catalogApi.createTestRange(testId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.ranges.forTest(testId) });
    },
  });
}

export function useUpdateTestRange(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ReferenceRangeInput }) =>
      catalogApi.updateTestRange(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.ranges.forTest(testId) });
    },
  });
}

export function useDeleteTestRange(testId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.deleteTestRange(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.ranges.forTest(testId) });
    },
  });
}

// ---------- Paneles ----------

export function usePanelsList(params: PanelListParams) {
  return useQuery({
    queryKey: catalogKeys.panels.list(params),
    queryFn: () => catalogApi.listPanels(params),
  });
}

export function usePanelDetail(id: string | null) {
  return useQuery({
    queryKey: catalogKeys.panels.detail(id ?? ''),
    queryFn: () => catalogApi.getPanel(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PanelCreateInput) => catalogApi.createPanel(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.all });
    },
  });
}

export function useUpdatePanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: PanelUpdateInput }) =>
      catalogApi.updatePanel(id, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.all });
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.detail(variables.id) });
    },
  });
}

export function useDeletePanel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.deletePanel(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.all });
    },
  });
}

export function useAddPanelTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ panelId, input }: { panelId: string; input: PanelTestInput }) =>
      catalogApi.addPanelTest(panelId, input),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.detail(variables.panelId) });
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.all });
    },
  });
}

export function useRemovePanelTest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ panelId, testId }: { panelId: string; testId: string }) =>
      catalogApi.removePanelTest(panelId, testId),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.detail(variables.panelId) });
      void qc.invalidateQueries({ queryKey: catalogKeys.panels.all });
    },
  });
}
