import { Outlet } from 'react-router-dom';
import { Activity, LogOut } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { useAuth } from '@shared/auth/useAuth';

function initials(name?: string | null, fallback?: string | null): string {
  const source = name?.trim() || fallback?.trim() || '?';
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export default function PatientLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-4" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">Lab Clinico</span>
              <span className="text-[11px] text-muted-foreground">Portal del paciente</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-medium">
                {user?.fullName ?? user?.documentNumber ?? user?.email}
              </span>
              <span className="text-[11px] text-muted-foreground">Paciente</span>
            </div>
            <div
              className="grid size-8 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700"
              aria-hidden
            >
              {initials(user?.fullName, user?.documentNumber ?? user?.email)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut /> <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 py-6 lg:py-10">
        <div className="container max-w-4xl">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          Los resultados son de uso medico. Consulta siempre con un profesional de salud.
        </div>
      </footer>
    </div>
  );
}
