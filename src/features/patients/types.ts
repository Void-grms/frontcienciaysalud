export type DocumentType = 'DNI' | 'CE' | 'PAS';
export type Sex = 'M' | 'F' | 'A';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface PatientPortalUser {
  id: string;
  email: string | null;
  status: 'active' | 'blocked' | 'pending';
  lastLoginAt: string | null;
}

export interface Patient {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate: string | null;
  sex: Sex | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  users?: PatientPortalUser[];
}

export interface PatientListParams {
  search?: string;
  documentType?: DocumentType;
  page?: number;
  perPage?: number;
}

export interface PatientCreateInput {
  documentType: DocumentType;
  documentNumber: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  sex?: Sex;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export type PatientUpdateInput = Partial<
  Omit<PatientCreateInput, 'documentType' | 'documentNumber'>
>;

export interface PortalAccessResponse {
  documentNumber: string;
  temporaryPassword: string;
}
