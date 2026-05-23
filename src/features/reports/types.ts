export interface ReportVersion {
  id: string;
  version: number;
  hashSha256: string;
  generatedAt: string;
  generatedByUserId: string | null;
}

// Respuesta de POST /orders/:id/report/regenerate. El backend devuelve el
// Report completo, pero solo necesitamos los campos visibles en la UI.
export interface ReportRegenerateResponse {
  id: string;
  version: number;
  hashSha256: string;
  generatedAt: string;
  pdfStorageKey: string;
}

export interface VerifyResponse {
  verified: boolean;
  orderCode: string;
  reportVersion: number;
  validatedAt: string | null;
  deliveredAt: string | null;
  isAmended: boolean;
  laboratory: { commercialName: string; taxId: string | null };
  patient: { initials: string; documentMasked: string };
  professionals: Array<{
    fullName: string;
    professionalTitle: string | null;
    licenseNumber: string | null;
  }>;
}
