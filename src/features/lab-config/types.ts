export interface LabConfig {
  id: string;
  commercialName: string;
  taxId: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  primaryColor: string | null;
  logoStorageKey: string | null;
  headerHtml: string | null;
  footerHtml: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LabConfigUpdateInput {
  commercialName?: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  primaryColor?: string;
  headerHtml?: string;
  footerHtml?: string;
}
