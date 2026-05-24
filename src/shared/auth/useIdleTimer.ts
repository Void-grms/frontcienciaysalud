import { useCallback, useEffect, useRef, useState } from 'react';

import { authApi } from '@features/auth/api';

// Configuracion del idle timer. Si el backend cambia IDLE_TIMEOUT_MINUTES,
// hay que actualizar IDLE_TIMEOUT_MS aqui tambien (no lo exponemos por API
// publica para evitar un fetch extra al bootstrap).
const IDLE_TIMEOUT_MS = 30 * 60_000; // 30 min
const WARNING_BEFORE_MS = 2 * 60_000; // mostrar modal 2 min antes
const ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
  'mousedown',
  'keydown',
  'touchstart',
  'scroll',
];
// Cada cuanto chequear el estado idle. Mas chico = mas preciso, mas wakeups.
const TICK_MS = 5_000;
// Heartbeat al backend mientras el usuario esta activo. Refresca lastActivityAt
// del refresh token para que el server enforce el timeout aunque el cliente
// nunca llame a /refresh (caso: pestana abierta sin requests durante mucho).
const HEARTBEAT_INTERVAL_MS = 5 * 60_000;
// Solo enviamos heartbeat si hubo actividad en esta ventana hacia atras.
// Asi una pestana en background no manda heartbeats al infinito.
const HEARTBEAT_FRESH_WINDOW_MS = 60_000;

export interface IdleTimerState {
  /** True cuando faltan <= WARNING_BEFORE_MS para el logout. */
  showWarning: boolean;
  /** Segundos restantes hasta el logout automatico. */
  secondsToLogout: number;
  /** Reinicia el timer manualmente (cuando el usuario clickea "Seguir conectado"). */
  extend: () => Promise<void>;
}

/**
 * Mide la inactividad del usuario y dispara `onTimeout` cuando se excede.
 *
 * - "Actividad" = clic, tecla, touch, scroll, o cualquier heartbeat manual.
 * - A los 28 min de idle, `showWarning` pasa a true.
 * - A los 30 min, llama `onTimeout` (el AuthProvider hace logout + toast).
 * - Mientras el usuario interactua, manda heartbeat al backend cada 5 min para
 *   que el lastActivityAt server-side no se quede atras.
 *
 * Solo se activa cuando `enabled=true` (= hay usuario logueado). Al pasar a
 * false desmonta listeners y resetea el estado.
 */
export function useIdleTimer(enabled: boolean, onTimeout: () => void): IdleTimerState {
  const lastActivityRef = useRef<number>(Date.now());
  const [showWarning, setShowWarning] = useState(false);
  const [secondsToLogout, setSecondsToLogout] = useState(
    Math.ceil(WARNING_BEFORE_MS / 1000),
  );

  const recordActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  const extend = useCallback(async () => {
    recordActivity();
    setShowWarning(false);
    setSecondsToLogout(Math.ceil(WARNING_BEFORE_MS / 1000));
    try {
      await authApi.heartbeat();
    } catch {
      // Si falla (sesion ya invalida server-side), el siguiente request al API
      // disparara el 401 → onAuthFailure → logout. No necesitamos forzarlo aqui.
    }
  }, [recordActivity]);

  useEffect(() => {
    if (!enabled) {
      setShowWarning(false);
      return undefined;
    }

    // Reset al activar (ej. justo despues de login).
    lastActivityRef.current = Date.now();

    const onActivity = () => {
      lastActivityRef.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach((ev) => document.addEventListener(ev, onActivity, { passive: true }));

    let lastHeartbeatAt = 0;

    const tick = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;

      if (idleMs >= IDLE_TIMEOUT_MS) {
        onTimeout();
        return;
      }

      const remaining = IDLE_TIMEOUT_MS - idleMs;
      if (remaining <= WARNING_BEFORE_MS) {
        setShowWarning(true);
        setSecondsToLogout(Math.ceil(remaining / 1000));
      } else {
        // El usuario interactuo y el timer ya esta lejos del limite → cerrar
        // modal. React hace bail-out si el valor no cambia, asi que llamarlo
        // siempre que `remaining > WARNING_BEFORE_MS` es seguro.
        setShowWarning(false);
      }

      // Heartbeat solo si el usuario interactuo recientemente y paso suficiente
      // tiempo desde el ultimo heartbeat. Asi una pestana abierta pero olvidada
      // no nos hace pings infinitos.
      const sinceHeartbeat = Date.now() - lastHeartbeatAt;
      if (idleMs <= HEARTBEAT_FRESH_WINDOW_MS && sinceHeartbeat >= HEARTBEAT_INTERVAL_MS) {
        lastHeartbeatAt = Date.now();
        void authApi.heartbeat().catch(() => {
          /* idem extend(): el proximo 401 desencadena el logout */
        });
      }
    }, TICK_MS);

    return () => {
      ACTIVITY_EVENTS.forEach((ev) => document.removeEventListener(ev, onActivity));
      window.clearInterval(tick);
    };
    // `showWarning` NO debe ir aqui: incluirlo remonta el effect en cada toggle,
    // re-suscribe listeners, resetea `lastActivityRef.current` a Date.now() y
    // produce parpadeo del modal. Leemos `showWarning` solo via setState (bail-out).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, onTimeout]);

  return { showWarning, secondsToLogout, extend };
}
