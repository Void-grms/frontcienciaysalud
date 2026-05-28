import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  Award,
  CalendarDays,
  ClipboardList,
  FileSearch,
  Hourglass,
  Medal,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Trophy,
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

function greetingEmoji(hour: number): { label: string; emoji: string } {
  if (hour < 6) return { label: 'Buenas noches', emoji: '🌙' };
  if (hour < 12) return { label: 'Buenos días', emoji: '☀️' };
  if (hour < 19) return { label: 'Buenas tardes', emoji: '👋' };
  return { label: 'Buenas noches', emoji: '🌙' };
}

export default function AdminOverview() {
  const { user } = useAuth();
  const [days, setDays] = useState<number>(30);
  const [now, setNow] = useState(() => new Date());

  const overview = useDashboardOverview();
  const timeline = useDashboardTimeline(days);
  const isRefreshing = overview.isFetching || timeline.isFetching;

  // Reloj del header: actualiza minuto a minuto.
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const refresh = () => {
    void overview.refetch();
    void timeline.refetch();
  };

  const firstName = user?.fullName?.split(' ')[0] ?? '';
  const greet = greetingEmoji(now.getHours());

  return (
    <div className="space-y-8">
      {/* Page header — saludo con emoji segun hora + reloj + estado del sistema */}
      <header
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary-50 via-card to-card p-6 shadow-xs animate-fade-in"
      >
        {/* Decoracion: blob suave del color primario en la esquina */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-primary-100/60 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary-700">
              <Sparkles className="size-3.5" />
              {greet.label} {greet.emoji}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {firstName ? `Hola, ${firstName}` : 'Dashboard'}
            </h1>
            <p className="text-sm text-muted-foreground">
              Resumen operativo del laboratorio en tiempo real.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success sm:inline-flex">
              <span className="size-1.5 rounded-full bg-success animate-pulse" />
              Sistema operativo
            </span>
            <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
              <RefreshCw className={cn(isRefreshing && 'animate-spin')} />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      {/* KPI tiles */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Indicadores clave
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <KpiTile
            index={0}
            icon={ClipboardList}
            label="Ordenes hoy"
            value={overview.data?.totalsToday.orders}
            hint={
              overview.data ? `${overview.data.totalsLast7d.orders} en los ultimos 7 dias` : null
            }
            loading={overview.isLoading}
            tone="info"
          />
          <KpiTile
            index={1}
            icon={Hourglass}
            label="Pendientes de validar"
            value={overview.data?.pendingValidation}
            hint="Ordenes en proceso"
            tone={(overview.data?.pendingValidation ?? 0) > 5 ? 'warning' : 'default'}
            loading={overview.isLoading}
          />
          <KpiTile
            index={2}
            icon={AlertOctagon}
            label="Resultados criticos (7d)"
            value={overview.data?.criticalsLast7d}
            hint="Requieren notificacion al medico"
            tone={(overview.data?.criticalsLast7d ?? 0) > 0 ? 'destructive' : 'success'}
            loading={overview.isLoading}
          />
          <KpiTile
            index={3}
            icon={UserPlus}
            label="Pacientes nuevos"
            value={overview.data?.newPatientsLast30d}
            hint="Registrados en los ultimos 30 dias"
            loading={overview.isLoading}
            tone="success"
          />
        </div>
      </section>

      {/* Timeline + Distribution */}
      <section
        className="grid gap-5 animate-fade-in lg:grid-cols-3"
        style={{ animationDelay: '200ms' }}
      >
        <Card className="overflow-hidden transition-shadow hover:shadow-md lg:col-span-2">
          <CardHeader className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-info/10 text-info shadow-xs">
                <CalendarDays className="size-4.5" />
              </div>
              <div>
                <CardTitle>Actividad diaria</CardTitle>
                <CardDescription>Ordenes creadas vs entregadas por día</CardDescription>
              </div>
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

        <Card className="overflow-hidden transition-shadow hover:shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-50 text-primary-700 shadow-xs">
                <Activity className="size-4.5" />
              </div>
              <div>
                <CardTitle>Estado de órdenes</CardTitle>
                <CardDescription>Distribución actual</CardDescription>
              </div>
            </div>
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
      <section
        className="grid gap-5 animate-fade-in lg:grid-cols-2"
        style={{ animationDelay: '280ms' }}
      >
        <Card className="overflow-hidden transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-warning/15 text-warning-foreground shadow-xs">
                <Trophy className="size-4.5" />
              </div>
              <div>
                <CardTitle>Pruebas más solicitadas</CardTitle>
                <CardDescription>Top 5 · últimos 30 días</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!overview.data ? (
              <ChartSkeleton lines={5} />
            ) : overview.data.topTests.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Sin órdenes en los últimos 30 días" />
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

        <Card className="overflow-hidden transition-shadow hover:shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-success/10 text-success shadow-xs">
                <TrendingUp className="size-4.5" />
              </div>
              <div>
                <CardTitle>Referencias más activas</CardTitle>
                <CardDescription>Top 5 · últimos 30 días</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!overview.data ? (
              <ChartSkeleton lines={5} />
            ) : overview.data.topReferences.length === 0 ? (
              <EmptyState icon={TrendingUp} title="Sin referencias con órdenes recientes" />
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
      <section className="animate-fade-in" style={{ animationDelay: '360ms' }}>
        <Card className="overflow-hidden border-primary-100 bg-gradient-to-br from-primary-50/60 via-card to-card">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <FileSearch className="size-5" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold">Auditoría del sistema</p>
                <p className="text-xs text-muted-foreground">
                  Revisa quién hizo qué y cuándo — registro inmutable de toda la actividad.
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link to="/admin/auditoria">
                Ver auditoría <ArrowUpRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

// ---- helpers ----

type Tone = 'default' | 'warning' | 'destructive' | 'success' | 'info';

interface KpiTileProps {
  icon: typeof Activity;
  label: string;
  value: number | undefined;
  hint?: string | null;
  tone?: Tone;
  loading?: boolean;
  index?: number;
}

// Estilos por tono: borde de acento + fondo del icono + gradient sutil de la card.
const TONE_STYLES: Record<
  Tone,
  { iconBg: string; iconColor: string; accent: string; bgGradient: string }
> = {
  default: {
    iconBg: 'bg-primary-50',
    iconColor: 'text-primary-700',
    accent: 'before:bg-primary',
    bgGradient: 'from-primary-50/40',
  },
  info: {
    iconBg: 'bg-info/10',
    iconColor: 'text-info',
    accent: 'before:bg-info',
    bgGradient: 'from-info/[0.06]',
  },
  warning: {
    iconBg: 'bg-warning/15',
    iconColor: 'text-warning-foreground',
    accent: 'before:bg-warning',
    bgGradient: 'from-warning/[0.07]',
  },
  destructive: {
    iconBg: 'bg-destructive/10',
    iconColor: 'text-destructive',
    accent: 'before:bg-destructive',
    bgGradient: 'from-destructive/[0.06]',
  },
  success: {
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    accent: 'before:bg-success',
    bgGradient: 'from-success/[0.07]',
  },
};

function KpiTile({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'default',
  loading,
  index = 0,
}: KpiTileProps) {
  const t = TONE_STYLES[tone];
  return (
    <Card
      className={cn(
        'group relative overflow-hidden bg-gradient-to-br to-card transition-all duration-200 animate-fade-in',
        'hover:-translate-y-0.5 hover:shadow-md',
        // Pseudo-elemento ::before como barra de acento vertical al borde izquierdo.
        'before:absolute before:left-0 before:top-0 before:h-full before:w-1',
        t.bgGradient,
        t.accent,
      )}
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <CardContent className="flex items-start gap-3 p-5">
        <div
          className={cn(
            'grid size-11 place-items-center rounded-xl ring-1 ring-inset shadow-xs transition-transform group-hover:scale-105',
            t.iconBg,
            t.iconColor,
            'ring-white/40',
          )}
          aria-hidden
        >
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-3xl font-semibold leading-none tabular-nums">
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

const MEDAL_STYLES = [
  { Icon: Trophy, bg: 'bg-warning/15', color: 'text-warning-foreground', label: 'Oro' },
  { Icon: Medal, bg: 'bg-muted', color: 'text-muted-foreground', label: 'Plata' },
  { Icon: Award, bg: 'bg-orange-100', color: 'text-orange-700', label: 'Bronce' },
];

function RankedList({ items }: { items: RankedItem[] }) {
  const maxCount = Math.max(1, ...items.map((i) => i.count));
  return (
    <ol className="space-y-2">
      {items.map((item, idx) => {
        const pct = (item.count / maxCount) * 100;
        const medal = idx < 3 ? MEDAL_STYLES[idx] : null;
        return (
          <li
            key={item.key}
            className="group relative overflow-hidden rounded-lg border border-border bg-card px-3 py-2.5 text-sm shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-sm animate-fade-in"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            {/* Barra de progreso de fondo con gradiente. */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary-100/70 to-primary-50/30 transition-[width] duration-500"
              style={{ width: `${pct}%` }}
              aria-hidden
            />
            <div className="relative flex items-center gap-3">
              {medal ? (
                <span
                  className={cn(
                    'grid size-7 shrink-0 place-items-center rounded-full shadow-xs ring-1 ring-white/40',
                    medal.bg,
                    medal.color,
                  )}
                  aria-label={`${medal.label} lugar`}
                  title={`#${idx + 1} · ${medal.label}`}
                >
                  <medal.Icon className="size-3.5" />
                </span>
              ) : (
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-semibold text-muted-foreground">
                  {idx + 1}
                </span>
              )}
              {item.badge && (
                <span className="rounded bg-card px-1.5 py-0.5 font-mono text-[11px] font-medium text-muted-foreground shadow-xs ring-1 ring-border">
                  {item.badge}
                </span>
              )}
              <span className="flex-1 truncate font-medium">{item.primary}</span>
              <span className="rounded-md bg-card px-2 py-0.5 text-sm font-bold tabular-nums shadow-xs ring-1 ring-border">
                {item.count}
              </span>
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
