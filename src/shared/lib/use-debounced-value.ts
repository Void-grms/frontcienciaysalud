import { useEffect, useState } from 'react';

// Hook ligero: devuelve el valor solo despues de que el usuario deja de
// teclear por `delay` ms. Evita lanzar una query por cada keystroke.
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
