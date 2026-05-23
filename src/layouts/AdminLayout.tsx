import { Link, NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { useAuth } from '@shared/auth/useAuth';
import { cn } from '@shared/lib/cn';

const NAV = [
  { to: '/admin', label: 'Inicio', end: true },
  { to: '/admin/catalogo', label: 'Catalogo' },
  { to: '/admin/pacientes', label: 'Pacientes' },
  { to: '/admin/referencias', label: 'Referencias' },
  { to: '/admin/profesionales', label: 'Profesionales' },
  { to: '/admin/ordenes', label: 'Ordenes' },
  { to: '/admin/auditoria', label: 'Auditoria' },
  { to: '/admin/configuracion', label: 'Configuracion' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-muted/30">
      <aside className="hidden w-64 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="border-b px-6 py-4">
          <Link to="/admin" className="text-lg font-semibold text-primary">
            Lab Admin
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b bg-card px-4 lg:px-6">
          <div className="text-sm text-muted-foreground">
            {user?.fullName ?? user?.email ?? 'Usuario'}
          </div>
          <Button variant="ghost" size="sm" onClick={() => void logout()}>
            <LogOut className="h-4 w-4" /> Cerrar sesion
          </Button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
