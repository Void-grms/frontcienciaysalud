import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { useAuth } from '@shared/auth/useAuth';
import { cn } from '@shared/lib/cn';

const NAV = [
  { to: '/referencia', label: 'Ordenes', end: true },
  { to: '/referencia/pacientes', label: 'Pacientes derivados' },
];

export default function ReferenceLayout() {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
        <span className="text-lg font-semibold text-primary">Portal Referencia</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {user?.fullName ?? user?.email ?? ''}
          </span>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" /> Salir
          </Button>
        </div>
      </header>
      <nav className="flex border-b bg-card px-4 lg:px-6">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'border-b-2 px-3 py-3 text-sm font-medium transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 lg:p-6">
        <Outlet />
      </main>
    </div>
  );
}
