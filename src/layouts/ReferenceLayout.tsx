import { NavLink, Outlet } from 'react-router-dom';
import { Activity, ClipboardList, LogOut, Users } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { useAuth } from '@shared/auth/useAuth';
import { cn } from '@shared/lib/cn';

const NAV = [
  { to: '/referencia', label: 'Ordenes', icon: ClipboardList, end: true },
  { to: '/referencia/pacientes', label: 'Pacientes derivados', icon: Users },
];

function initials(name?: string | null, fallback?: string | null): string {
  const source = name?.trim() || fallback?.trim() || '?';
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

export default function ReferenceLayout() {
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
              <span className="text-[11px] text-muted-foreground">Portal de referencia</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden flex-col items-end leading-tight sm:flex">
              <span className="text-sm font-medium">
                {user?.fullName ?? user?.email}
              </span>
              <span className="text-[11px] text-muted-foreground">Clinica de referencia</span>
            </div>
            <div
              className="grid size-8 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700"
              aria-hidden
            >
              {initials(user?.fullName, user?.email)}
            </div>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              <LogOut /> <span className="hidden sm:inline">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      <nav className="border-b border-border bg-card">
        <div className="container flex gap-1 overflow-x-auto">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-primary text-primary-700'
                      : 'border-transparent text-muted-foreground hover:text-foreground',
                  )
                }
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 py-6 lg:py-8">
        <div className="container">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
