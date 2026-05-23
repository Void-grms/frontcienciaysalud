export type ProfessionalStatus = 'active' | 'inactive';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface Professional {
  id: string;
  fullName: string;
  professionalTitle: string | null;
  licenseNumber: string | null;
  signatureStorageKey: string | null;
  status: ProfessionalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalListParams {
  search?: string;
  status?: ProfessionalStatus;
  page?: number;
  perPage?: number;
}

export interface ProfessionalCreateInput {
  fullName: string;
  professionalTitle?: string;
  licenseNumber?: string;
  // El signature se envia por separado en el FormData; lo dejamos fuera del DTO
  // base porque los tipos del Axios son distintos en multipart.
  signature?: File | null;
}

export type ProfessionalUpdateInput = Partial<
  Omit<ProfessionalCreateInput, 'signature'>
> & {
  status?: ProfessionalStatus;
};
