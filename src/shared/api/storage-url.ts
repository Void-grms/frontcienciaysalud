// Resuelve una `storageKey` (formato "folder/uuid.ext" que devuelve el backend)
// a la URL servida por `/storage/:folder/:fileName`. Mantenemos esta logica en
// un solo lugar para que cambios de hosting (CDN, signed URLs en el futuro)
// se hagan aqui.
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

export function storageUrl(key: string | null | undefined): string | null {
  if (!key) return null;
  return `${API_URL}/storage/${key}`;
}
