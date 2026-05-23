import { Outlet } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-card">
        <div className="container flex h-14 items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Activity className="size-4" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">Lab Clinico</span>
            <span className="text-[11px] text-muted-foreground">Verificacion publica de informes</span>
          </div>
        </div>
      </header>

      <main className="flex-1 py-8 lg:py-12">
        <div className="container max-w-3xl">
          <Outlet />
        </div>
      </main>

      <footer className="border-t border-border bg-card/50 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          Esta pagina verifica la autenticidad del informe. No muestra resultados por privacidad.
        </div>
      </footer>
    </div>
  );
}
