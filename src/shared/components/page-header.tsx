import type { ReactNode } from 'react';

import { cn } from '@shared/lib/cn';

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  /** Acciones a la derecha (ej. boton "Nuevo paciente"). */
  actions?: ReactNode;
  /** Slot opcional debajo del titulo (breadcrumbs, badges, etc.). */
  meta?: ReactNode;
  className?: string;
}

/**
 * Encabezado consistente para las paginas internas del admin / paciente /
 * referencia. Mantiene tipografia y spacing uniformes; deja la composicion de
 * acciones libre.
 */
export function PageHeader({ title, description, actions, meta, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-start justify-between gap-4', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        {meta && <div className="mt-3">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
