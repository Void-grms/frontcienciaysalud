import { api } from '@shared/api/client';

import type {
  Category,
  CategoryInput,
  CategoryListParams,
  ImportConfirmResponse,
  ImportDryRunResponse,
  Paginated,
  Panel,
  PanelCreateInput,
  PanelListItem,
  PanelListParams,
  PanelTestEntry,
  PanelTestInput,
  PanelUpdateInput,
  ReferenceRange,
  ReferenceRangeInput,
  Test,
  TestCreateInput,
  TestListParams,
  TestUpdateInput,
} from './types';

export const catalogApi = {
  // -------- Categorias --------
  async listCategories(params: CategoryListParams = {}): Promise<Paginated<Category>> {
    const { data } = await api.get<Paginated<Category>>('/catalog/categories', { params });
    return data;
  },

  async getCategory(id: string): Promise<Category> {
    const { data } = await api.get<Category>(`/catalog/categories/${id}`);
    return data;
  },

  async createCategory(input: CategoryInput): Promise<Category> {
    const { data } = await api.post<Category>('/catalog/categories', input);
    return data;
  },

  async updateCategory(id: string, input: Partial<CategoryInput>): Promise<Category> {
    const { data } = await api.patch<Category>(`/catalog/categories/${id}`, input);
    return data;
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/catalog/categories/${id}`);
  },

  // -------- Pruebas --------
  async listTests(params: TestListParams = {}): Promise<Paginated<Test>> {
    const { data } = await api.get<Paginated<Test>>('/catalog/tests', { params });
    return data;
  },

  async getTest(id: string): Promise<Test> {
    const { data } = await api.get<Test>(`/catalog/tests/${id}`);
    return data;
  },

  async createTest(input: TestCreateInput): Promise<Test> {
    const { data } = await api.post<Test>('/catalog/tests', input);
    return data;
  },

  async updateTest(id: string, input: TestUpdateInput): Promise<Test> {
    const { data } = await api.patch<Test>(`/catalog/tests/${id}`, input);
    return data;
  },

  async deleteTest(id: string): Promise<void> {
    await api.delete(`/catalog/tests/${id}`);
  },

  // -------- Rangos referenciales --------
  async listTestRanges(testId: string): Promise<ReferenceRange[]> {
    const { data } = await api.get<ReferenceRange[]>(`/catalog/tests/${testId}/ranges`);
    return data;
  },

  async createTestRange(testId: string, input: ReferenceRangeInput): Promise<ReferenceRange> {
    const { data } = await api.post<ReferenceRange>(`/catalog/tests/${testId}/ranges`, input);
    return data;
  },

  async updateTestRange(id: string, input: ReferenceRangeInput): Promise<ReferenceRange> {
    const { data } = await api.patch<ReferenceRange>(`/catalog/ranges/${id}`, input);
    return data;
  },

  async deleteTestRange(id: string): Promise<void> {
    await api.delete(`/catalog/ranges/${id}`);
  },

  // -------- Paneles --------
  async listPanels(params: PanelListParams = {}): Promise<Paginated<PanelListItem>> {
    const { data } = await api.get<Paginated<PanelListItem>>('/catalog/panels', { params });
    return data;
  },

  async getPanel(id: string): Promise<Panel> {
    const { data } = await api.get<Panel>(`/catalog/panels/${id}`);
    return data;
  },

  async createPanel(input: PanelCreateInput): Promise<Panel> {
    const { data } = await api.post<Panel>('/catalog/panels', input);
    return data;
  },

  async updatePanel(id: string, input: PanelUpdateInput): Promise<Panel> {
    const { data } = await api.patch<Panel>(`/catalog/panels/${id}`, input);
    return data;
  },

  async deletePanel(id: string): Promise<void> {
    await api.delete(`/catalog/panels/${id}`);
  },

  async addPanelTest(panelId: string, input: PanelTestInput): Promise<PanelTestEntry> {
    const { data } = await api.post<PanelTestEntry>(`/catalog/panels/${panelId}/tests`, input);
    return data;
  },

  async removePanelTest(panelId: string, testId: string): Promise<void> {
    await api.delete(`/catalog/panels/${panelId}/tests/${testId}`);
  },

  // -------- Importacion XLSX --------
  async downloadImportTemplate(): Promise<Blob> {
    const { data } = await api.get<Blob>('/catalog/tests/import-template', {
      responseType: 'blob',
    });
    return data;
  },

  async uploadImport(file: File): Promise<ImportDryRunResponse> {
    const form = new FormData();
    form.append('file', file);
    // Axios setea Content-Type automaticamente cuando ve un FormData, hay
    // que limpiar el header default (que es application/json) para que
    // genere el `multipart/form-data; boundary=...` correcto.
    const { data } = await api.post<ImportDryRunResponse>('/catalog/tests/import', form, {
      headers: { 'Content-Type': undefined as unknown as string },
    });
    return data;
  },

  async confirmImport(importToken: string): Promise<ImportConfirmResponse> {
    const { data } = await api.post<ImportConfirmResponse>(
      `/catalog/tests/import/${importToken}/confirm`,
    );
    return data;
  },

  async downloadImportErrors(importToken: string): Promise<Blob> {
    const { data } = await api.get<Blob>(
      `/catalog/tests/import/${importToken}/errors.xlsx`,
      { responseType: 'blob' },
    );
    return data;
  },
};
