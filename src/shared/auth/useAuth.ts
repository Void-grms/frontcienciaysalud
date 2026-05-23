import { useContext } from 'react';

import { AuthContext } from './AuthProvider';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider />');
  }
  return ctx;
}

export function defaultPathForRole(role: import('./types').UserRole): string {
  switch (role) {
    case 'admin':
      return '/admin';
    case 'patient':
      return '/paciente';
    case 'reference_user':
      return '/referencia';
  }
}
