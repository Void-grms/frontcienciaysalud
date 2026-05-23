import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper estandar de shadcn/ui: combina condicionales (clsx) y resuelve
// conflictos de utilidades de Tailwind (twMerge) sin perder la ultima.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
