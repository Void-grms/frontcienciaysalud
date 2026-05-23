import { useCallback, useEffect, useRef, useState } from 'react';
import { useBulkSaveResults } from './hooks';
import type { BulkResultEntry } from './types';

const AUTOSAVE_DELAY_MS = 10_000;

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutosaveArgs {
  orderId: string | null;
  // El consumer arma los entries a partir de su estado local. Lo dejamos como
  // callback para que el hook no necesite conocer la estructura concreta de
  // los inputs (numeric vs text vs qualitative) y solo reaccione a "hay algo
  // que guardar".
  buildEntries: () => BulkResultEntry[];
  onSaved?: () => void;
  onError?: (err: unknown) => void;
}

interface UseAutosaveResult {
  status: SaveStatus;
  lastSavedAt: number | null;
  // Llamar desde el form cuando cambia algo. Marca dirty y arranca el timer.
  markDirty: () => void;
  // Fuerza save inmediato (boton "Guardar ahora" o al navegar fuera).
  flush: () => Promise<void>;
  hasPending: boolean;
}

// Autosave con debounce + flush manual. El callback `buildEntries` se llama
// en el momento del save para tomar el estado mas reciente del componente.
// Esto evita capturas obsoletas (closure stale) cuando hay ediciones rapidas.
export function useAutosave({
  orderId,
  buildEntries,
  onSaved,
  onError,
}: UseAutosaveArgs): UseAutosaveResult {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [hasPending, setHasPending] = useState(false);

  const timerRef = useRef<number | null>(null);
  const inFlightRef = useRef(false);
  // Mantenemos referencias estables a las callbacks para no romper el timer
  // si el componente re-renderiza con funciones nuevas.
  const buildRef = useRef(buildEntries);
  const onSavedRef = useRef(onSaved);
  const onErrorRef = useRef(onError);
  buildRef.current = buildEntries;
  onSavedRef.current = onSaved;
  onErrorRef.current = onError;

  const bulkSave = useBulkSaveResults();

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const doSave = useCallback(async () => {
    if (!orderId) return;
    if (inFlightRef.current) {
      // Si llega otra peticion mientras hay una en vuelo, la marcamos como
      // pending para que se dispare cuando termine la actual.
      setHasPending(true);
      return;
    }
    const entries = buildRef.current();
    if (entries.length === 0) {
      setStatus('idle');
      setHasPending(false);
      return;
    }
    inFlightRef.current = true;
    setStatus('saving');
    try {
      await bulkSave.mutateAsync({ orderId, input: { entries } });
      setLastSavedAt(Date.now());
      setStatus('saved');
      setHasPending(false);
      onSavedRef.current?.();
    } catch (err) {
      setStatus('error');
      onErrorRef.current?.(err);
    } finally {
      inFlightRef.current = false;
    }
  }, [orderId, bulkSave]);

  const markDirty = useCallback(() => {
    setHasPending(true);
    setStatus('pending');
    clearTimer();
    timerRef.current = window.setTimeout(() => {
      void doSave();
    }, AUTOSAVE_DELAY_MS);
  }, [clearTimer, doSave]);

  const flush = useCallback(async () => {
    clearTimer();
    await doSave();
  }, [clearTimer, doSave]);

  // Cleanup al desmontar: si hay timer en curso, lo cancelamos. Importante:
  // NO disparamos save aqui porque el componente puede estar desmontandose por
  // navegacion y no queremos un fetch huerfano. El consumer debe llamar
  // `flush()` desde un beforeunload si quiere garantizar el guardado.
  useEffect(() => clearTimer, [clearTimer]);

  return { status, lastSavedAt, markDirty, flush, hasPending };
}
