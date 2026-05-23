export type ReferenceStatus = 'active' | 'inactive';

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
}

export interface ReferenceUser {
  id: string;
  email: string;
  fullName: string;
  status: 'active' | 'blocked' | 'pending';
  lastLoginAt: string | null;
  mustChangePassword: boolean;
}

export interface ReferenceListItem {
  id: string;
  name: string;
  taxId: string | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  notes: string | null;
  status: ReferenceStatus;
  createdAt: string;
  updatedAt: string;
  _count?: { users: number };
}

export interface Reference extends ReferenceListItem {
  users: ReferenceUser[];
}

export interface ReferenceListParams {
  search?: string;
  status?: ReferenceStatus;
  page?: number;
  perPage?: number;
}

export interface ReferenceCreateInput {
  name: string;
  taxId?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
}

export type ReferenceUpdateInput = Partial<ReferenceCreateInput> & {
  status?: ReferenceStatus;
};

export interface ReferenceUserCreateInput {
  email: string;
  fullName: string;
  password?: string;
}

export interface ReferenceUserCreateResponse {
  user: Pick<ReferenceUser, 'id' | 'email' | 'fullName' | 'mustChangePassword' | 'status'>;
  temporaryPassword: string | null;
}
