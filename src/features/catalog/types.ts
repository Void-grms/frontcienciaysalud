export type CatalogStatus = 'active' | 'inactive';
export type ResultType = 'numeric' | 'text' | 'qualitative' | 'observation';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

// ----- Categorias -----

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  displayOrder: number;
  status: CatalogStatus;
  defaultProfessionalId: string | null;
  defaultProfessional?: { id: string; fullName: string } | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CategoryListParams {
  search?: string;
  status?: CatalogStatus;
  page?: number;
  perPage?: number;
}

export interface CategoryInput {
  name: string;
  description?: string;
  color?: string;
  displayOrder?: number;
  defaultProfessionalId?: string;
}

// ----- Pruebas -----

export interface TestOption {
  id: string;
  value: string;
  displayOrder: number;
}

export interface Test {
  id: string;
  code: string;
  name: string;
  shortName: string | null;
  categoryId: string;
  category?: { id: string; name: string; color: string | null } | null;
  resultType: ResultType;
  unit: string | null;
  method: string | null;
  decimals: number;
  minCritical: number | null;
  maxCritical: number | null;
  referenceText: string | null;
  professionalId: string | null;
  professional?: { id: string; fullName: string } | null;
  status: CatalogStatus;
  version: number;
  options?: TestOption[];
  createdAt: string;
  updatedAt: string;
}

export interface TestListParams {
  search?: string;
  categoryId?: string;
  status?: CatalogStatus;
  resultType?: ResultType;
  page?: number;
  perPage?: number;
}

export interface TestOptionInput {
  value: string;
  displayOrder?: number;
}

export interface TestCreateInput {
  code: string;
  name: string;
  shortName?: string;
  categoryId: string;
  resultType: ResultType;
  unit?: string;
  method?: string;
  decimals?: number;
  minCritical?: number;
  maxCritical?: number;
  referenceText?: string;
  professionalId?: string;
  options?: TestOptionInput[];
}

export type TestUpdateInput = Partial<Omit<TestCreateInput, 'code'>> & {
  status?: CatalogStatus;
};

// ----- Rangos referenciales -----

export type Sex = 'M' | 'F' | 'A';
export type PhysiologicalState = 'none' | 'pregnancy' | 'lactation';

export interface ReferenceRange {
  id: string;
  testId: string;
  sex: Sex;
  ageMinDays: number | null;
  ageMaxDays: number | null;
  physiologicalState: PhysiologicalState | null;
  valueMin: string | number | null;
  valueMax: string | number | null;
  // Umbrales de panico — disparan flag critical_low/high. Pueden quedar en
  // null si el rango solo deberia generar low/high (no critico).
  criticalMin: string | number | null;
  criticalMax: string | number | null;
  qualitativeExpected: string | null;
  displayText: string | null;
  priority: number;
  version: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReferenceRangeInput {
  sex?: Sex;
  ageMinDays?: number;
  ageMaxDays?: number;
  physiologicalState?: PhysiologicalState;
  valueMin?: number;
  valueMax?: number;
  criticalMin?: number;
  criticalMax?: number;
  qualitativeExpected?: string;
  displayText?: string;
  priority?: number;
  effectiveFrom?: string;
}

// ----- Paneles -----

export interface PanelTestEntry {
  id: string;
  testId: string;
  displayOrder: number;
  test: {
    id: string;
    code: string;
    name: string;
    resultType: ResultType;
    unit: string | null;
    categoryId: string;
  };
}

export interface PanelListItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  defaultProfessionalId: string | null;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
  // El backend devuelve _count con la cantidad de pruebas asociadas.
  _count?: { panelTests: number };
}

export interface Panel extends PanelListItem {
  panelTests: PanelTestEntry[];
}

export interface PanelListParams {
  search?: string;
  status?: CatalogStatus;
  page?: number;
  perPage?: number;
}

export interface PanelTestInput {
  testId: string;
  displayOrder?: number;
}

export interface PanelCreateInput {
  code: string;
  name: string;
  description?: string;
  defaultProfessionalId?: string;
  tests?: PanelTestInput[];
}

export type PanelUpdateInput = Partial<Omit<PanelCreateInput, 'code' | 'tests'>> & {
  status?: CatalogStatus;
};

// ----- Importacion XLSX -----

export type ImportSheet = 'Categorias' | 'Pruebas' | 'Rangos';

export interface ImportError {
  sheet: ImportSheet;
  row: number;
  column: string;
  message: string;
}

export interface ImportSummary {
  categories: { rows: number; toCreate: number; toUpdate: number };
  tests: { rows: number; toCreate: number; toUpdate: number };
  ranges: { rows: number; toCreate: number };
  errorCount: number;
}

export interface ImportDryRunResponse {
  importToken: string;
  summary: ImportSummary;
  errors: ImportError[];
  expiresAt: string;
}

export interface ImportConfirmResponse {
  jobId: string;
  summary: ImportSummary;
}
