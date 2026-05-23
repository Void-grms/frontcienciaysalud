import type { UseFormSetError } from 'react-hook-form';
import { toast } from 'sonner';

import { ApiError } from '@shared/api/error-mapper';

// Aplica errores RFC 7807 al estado del form (cuando el backend incluye
// `errors: [{ field, message }]`) y dispara un toast con el mensaje principal.
// Para errores sin field aplica un toast destructivo y no toca el form.
export function reportFormError<TForm extends Record<string, unknown>>(
  err: unknown,
  setError?: UseFormSetError<TForm>,
): void {
  const apiErr = err instanceof ApiError ? err : null;
  if (apiErr) {
    if (setError && apiErr.fieldErrors.length > 0) {
      for (const fe of apiErr.fieldErrors) {
        // El backend devuelve nombres como "items.0.value"; RHF acepta paths
        // con notacion de puntos, asi que se mapea 1:1.
        setError(fe.field as never, { type: 'server', message: fe.message });
      }
    }
    toast.error(apiErr.title, { description: apiErr.detail ?? apiErr.message });
    return;
  }
  toast.error('Error inesperado', {
    description: err instanceof Error ? err.message : String(err),
  });
}
