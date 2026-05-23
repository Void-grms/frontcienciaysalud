import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  FileSearch,
  Hourglass,
  RefreshCw,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { DailyBars } from '@shared/components/charts/daily-bars';
import { StateDistribution } from '@shared/components/charts/state-distribution';
import { useAuth } from '@shared/auth/useAuth';
import { cn } from '@shared/lib/cn';

import {
  useDashboardOverview,
  useDashboardTimeline,
} from '@features/dashboards/hooks';

const RANGE_OPTIONS = [
  { value: 7, label: 'Ultimos 7 dias' },
  { value: 14, label: 'Ultimos 14 dias' },
  { value: 30, label: 'Ultimos 30 dias' },
  { value: 60, label: 'Ultimos 60 dias' },
  { value: 90, label: 'Ultimos 90 dias' },
];

export default function AdminOverview() {
  const { user } = useAuth();
  const [days, setDays] = useState<number>(30);

  const overview = useDashboardOverview();
  const timeline = useDashboardTimeline(days);
  const isRefreshing = overview.isFetching || timeline.isFetching;

  const refresh = () => {
    void overview.refetch();
    void timeline.refetch();
  };

  const firstName = user?.fullName?.split(' ')[0] ?? '';

  return (
    <div className="space-y-8">
      {/* Page header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {firstName ? `Hola, ${firstName}` : 'Dashboard'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Resumen operativo del laboratorio en tiempo real.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
          <RefreshCw className={cn(isRefreshing && 'animate-spin')} />
          Actualizar
        </Button>
      </header>

      {/* KPI tiles */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Indicadores clave
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            icon={ClipboardList}
            label="Ordenes hoy"
            value={overview.data?.totalsToday.orders}
            hint={
              overview.data ? `${overview.data.totalsLast7d.orders} en los ultimos 7 dias` : null
            }
            loading={overview.isLoading}
          />
          <KpiTile
            icon={Hourglass}
            label="Pendientes de validar"
            value={overview.data?.pendingValidation}
            hint="Ordenes en proceso"
            tone={(overview.data?.pendingValidation ?? 0) > 5 ? 'warning' : 'default'}
            loading={overview.isLoading}
          />
          <KpiTile
            icon={AlertOctagon}
            label="Resultados criticos (7d)"
            value={overview.data?.criticalsLast7d}
            hint="Requieren notificacion al medico"
            tone={(overview.data?.criticalsLast7d ?? 0) > 0 ? 'destructive' : 'default'}
            loading={overview.isLoading}
          />
          <KpiTile
            icon={UserPlus}
            label="Pacientes nuevos"
            value={overview.data?.newPatientsLast30d}
            hint="Registrados en los ultimos 30 dias"
            loading={overview.isLoading}
          />
        </div>
      </section>

      {/* Timeline + Distribution */}
      <section className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted-foreground" />
                Actividad diaria
              </CardTitle>
              <CardDescription>Ordenes creadas vs entregadas por dia</CardDescription>
            </div>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RANGE_OPTIONS.map((r) => (
                  <SelectItem key={r.value} value={String(r.value)}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {timeline.isLoading ? (
              <ChartSkeleton />
            ) : timeline.isError ? (
              <EmptyState
                icon={AlertOctagon}
                title="No se pudo cargar el timeline"
                tone="destructive"
              />
            ) : (
              <DailyBars data={timeline.data ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Activity className="size-4 text-muted-foreground" />
              Estado de ordenes
            </CardTitle>
            <CardDescription>Distribucion actual</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.isLoading ? (
              <ChartSkeleton />
            ) : overview.data ? (
              <StateDistribution data={overview.data.ordersByState} />
            ) : (
              <EmptyState icon={AlertOctagon} title="Sin datos" tone="destructive" />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Top tests + Top referencias */}
      <section className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              Pruebas mas solicitadas
            </CardTitle>
            <CardDescription>Top 5 · ultimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {!overview.data ? (
              <ChartSkeleton lines={5} />
            ) : overview.data.topTests.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Sin ordenes en los ultimos 30 dias" />
            ) : (
              <RankedList
                items={overview.data.topTests.map((t) => ({
                  key: t.testId,
                  primary: t.name,
                  badge: t.code,
                  count: t.count,
                }))}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-4 text-muted-foreground" />
              Referencias mas activas
            </CardTitle>
            <CardDescription>Top 5 · ultimos 30 dias</CardDescription>
          </CardHeader>
          <CardContent>
            {!overview.data ? (
              <ChartSkeleton lines={5} />
            ) : overview.data.topReferences.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Sin referencias con ordenes recientes" />
            ) : (
              <RankedList
                items={overview.data.topReferences.map((r) => ({
                  key: r.referenceId,
                  primary: r.name,
                  count: r.count,
                }))}
              />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Footer CTA */}
      <section>
        <Card className="bg-muted/40">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-md bg-card text-muted-foreground shadow-xs">
                <FileSearch className="size-4" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-medium">Auditoria del sistema</p>
                <p className="text-xs text-muted-foreground">
                  Revisa quien hizo que y cuando — registro inmutable de toda la actividad.
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/auditoria">
                Ver auditoria <ArrowUpRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ---- helpers ----

type Tone = 'default' | 'warning' | 'destructive' | 'success';

interface KpiTileProps {
  icon: typeof Activity;
  label: string;
  value: number | undefined;
  hint?: string | null;
  tone?: Tone;
  loading?: boolean;
}

function KpiTile({ icon: Icon, label, value, hint, tone = 'default', loading }: KpiTileProps) {
  const iconBg: Record<Tone, string> = {
    default: 'bg-primary-50 text-primary-700',
    warning: 'bg-warning/15 text-warning-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
  };
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-5">
        <div className={cn('grid size-10 place-items-center rounded-md', iconBg[tone])} aria-hidden>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted-foreground">{label}</div>
          <div className="mt-1 text-2xl font-semibold leading-none tabular-nums">
            {loading ? <span className="text-muted-foreground">—</span> : (value ?? 0)}
          </div>
          {hint && <div className="mt-2 truncate text-xs text-muted-foreground">{hint}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

interface RankedItem {
  key: string;
  primary: string;
  badge?: string;
  count: number;
}

function RankedList({ items }: { items: RankedItem[] }) {
  const maxCount = Math.max(1, ...items.map((i) => i.count));
  return (
    <ol className="space-y-1.5">
      {items.map((item, idx) => {
        const pct = (item.count / maxCount) * 100;
        return (
          <li
            key={item.key}
            className="group relative overflow-hidden rounded-md border border-border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-muted/40"
          >
            <div
              className="absolute inset-y-0 left-0 bg-primary-50/60"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                {idx + 1}
              </span>
              {item.badge && (
                <span className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground shadow-xs">
                  {item.badge}
                </span>
              )}
              <span className="flex-1 truncate font-medium">{item.primary}</span>
              <span className="font-semibold tabular-nums">{item.count}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ChartSkeleton({ lines = 8 }: { lines?: number } = {}) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-muted"
          style={{ width: `${60 + Math.random() * 35}%` }}
        />
      ))}
    </div>
  );
}

interface EmptyStateProps {
  icon: typeof Activity;
  title: string;
  tone?: 'default' | 'destructive';
}

function EmptyState({ icon: Icon, title, tone = 'default' }: EmptyStateProps) {
  return (
    <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
      <Icon
        className={cn(
          'size-6',
          tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground/60',
        )}
      />
      <p
        className={cn(
          'text-sm',
          tone === 'destructive' ? 'text-destructive' : 'text-muted-foreground',
        )}
      >
        {title}
      </p>
    </div>
  );
}
