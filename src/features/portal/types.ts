import type { Sex } from '@features/patients/types';

// Tipo "ligero" del paciente que devuelve `/me/reference/patients`. Difiere
// del Patient completo del CRUD admin en que no incluye email/phone/address
// pero suma `_count.orders` con el numero de ordenes derivadas por la
// referencia del usuario logueado.
export interface DerivedPatient {
  id: string;
  firstName: string;
  lastName: string;
  documentType: 'DNI' | 'CE' | 'PAS';
  documentNumber: string;
  birthDate: string | null;
  sex: Sex | null;
  _count: { orders: number };
}

export interface DerivedPatientsParams {
  search?: string;
  page?: number;
  perPage?: number;
}
