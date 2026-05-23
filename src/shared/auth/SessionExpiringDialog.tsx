import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';

interface Props {
  open: boolean;
  secondsToLogout: number;
  onExtend: () => void;
  onLogoutNow: () => void;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, seconds);
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function SessionExpiringDialog({ open, secondsToLogout, onExtend, onLogoutNow }: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tu sesion esta por expirar</AlertDialogTitle>
          <AlertDialogDescription>
            No detectamos actividad en los ultimos minutos. Por seguridad cerraremos tu sesion en{' '}
            <span className="font-semibold tabular-nums">{formatTime(secondsToLogout)}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onLogoutNow}>Cerrar sesion ahora</AlertDialogCancel>
          <AlertDialogAction onClick={onExtend}>Continuar conectado</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
