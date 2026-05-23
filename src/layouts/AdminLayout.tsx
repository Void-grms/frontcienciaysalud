import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  ClipboardList,
  FileSearch,
  FlaskConical,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { useAuth } from '@shared/auth/useAuth';
import { cn } from '@shared/lib/cn';

const NAV_PRIMARY = [
  { to: '/admin', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/admin/ordenes', label: 'Ordenes', icon: ClipboardList },
  { to: '/admin/pacientes', label: 'Pacientes', icon: Users },
  { to: '/admin/referencias', label: 'Referencias', icon: Stethoscope },
];

const NAV_SECONDARY = [
  { to: '/admin/catalogo', label: 'Catalogo', icon: FlaskConical },
  { to: '/admin/profesionales', label: 'Profesionales', icon: Stethoscope },
  { to: '/admin/auditoria', label: 'Auditoria', icon: FileSearch },
  { to: '/admin/configuracion', label: 'Configuracion', icon: Settings },
];

function initialsFromName(name?: string | null, fallback?: string | null): string {
  const source = name?.trim() || fallback?.trim() || '?';
  const parts = source.split(/[\s.@]+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
}

function NavSection({
  title,
  items,
  onNavigate,
}: {
  title?: string;
  items: typeof NAV_PRIMARY;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {title && (
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'size-4 shrink-0',
                    isActive ? 'text-primary-700' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                <span className="truncate">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar fijo desktop */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card lg:flex lg:flex-col">
        <SidebarHeader />
        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
          <NavSection items={NAV_PRIMARY} />
          <NavSection title="Configuracion" items={NAV_SECONDARY} />
        </nav>
        <SidebarUserCard
          name={user?.fullName ?? null}
          identifier={user?.email ?? user?.documentNumber ?? null}
          role={user?.role ?? null}
          onLogout={() => void logout()}
        />
      </aside>

      {/* Sidebar mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col border-r border-border bg-card animate-fade-in">
            <SidebarHeader onClose={() => setMobileOpen(false)} />
            <nav className="flex flex-1 flex-col gap-5 overflow-y-auto p-3">
              <NavSection items={NAV_PRIMARY} onNavigate={() => setMobileOpen(false)} />
              <NavSection
                title="Configuracion"
                items={NAV_SECONDARY}
                onNavigate={() => setMobileOpen(false)}
              />
            </nav>
            <SidebarUserCard
              name={user?.fullName ?? null}
              identifier={user?.email ?? user?.documentNumber ?? null}
              role={user?.role ?? null}
              onLogout={() => void logout()}
            />
          </aside>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/80 px-4 backdrop-blur lg:px-6">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu />
          </Button>
          <div className="flex flex-1 items-center justify-between">
            <h1 className="text-sm font-medium text-muted-foreground lg:hidden">Lab Admin</h1>
            <div className="hidden lg:block" />
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-muted-foreground sm:block">
                {user?.fullName ?? user?.email ?? user?.documentNumber}
              </span>
              <div
                className="grid size-8 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700"
                aria-hidden
              >
                {initialsFromName(user?.fullName, user?.email ?? user?.documentNumber)}
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto bg-background">
          <div className="container py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarHeader({ onClose }: { onClose?: () => void } = {}) {
  return (
    <div className="flex h-14 items-center justify-between border-b border-border px-4">
      <Link to="/admin" className="flex items-center gap-2">
        <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
          <Activity className="size-4" />
        </div>
        <span className="text-sm font-semibold tracking-tight">Lab Clinico</span>
      </Link>
      {onClose && (
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Cerrar menu">
          <X />
        </Button>
      )}
    </div>
  );
}

function SidebarUserCard({
  name,
  identifier,
  role,
  onLogout,
}: {
  name: string | null;
  identifier: string | null;
  role: string | null;
  onLogout: () => void;
}) {
  const roleLabel: Record<string, string> = {
    admin: 'Administrador',
    patient: 'Paciente',
    reference_user: 'Referencia',
  };
  return (
    <div className="border-t border-border p-3">
      <div className="flex items-center gap-2.5 rounded-md px-2 py-2">
        <div
          className="grid size-9 place-items-center rounded-full bg-primary-50 text-xs font-semibold text-primary-700"
          aria-hidden
        >
          {initialsFromName(name, identifier)}
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{name ?? identifier ?? 'Usuario'}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            {role ? (roleLabel[role] ?? role) : ''}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onLogout}
          aria-label="Cerrar sesion"
          title="Cerrar sesion"
        >
          <LogOut />
        </Button>
      </div>
    </div>
  );
}
