import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertOctagon,
  CalendarDays,
  ClipboardList,
  Hourglass,
  RefreshCw,
  TrendingUp,
  UserPlus,
} from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
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

  const refresh = () => {
    void overview.refetch();
    void timeline.refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Bienvenido {user?.fullName ?? user?.email}. Resumen operativo del laboratorio.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={overview.isFetching || timeline.isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${overview.isFetching || timeline.isFetching ? 'animate-spin' : ''}`}
          />
          Actualizar
        </Button>
      </div>

      {/* KPI tiles */}
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
          tone={
            (overview.data?.pendingValidation ?? 0) > 5 ? 'warning' : 'default'
          }
          loading={overview.isLoading}
        />
        <KpiTile
          icon={AlertOctagon}
          label="Criticos (7d)"
          value={overview.data?.criticalsLast7d}
          hint="Resultados marcados criticos"
          tone={(overview.data?.criticalsLast7d ?? 0) > 0 ? 'destructive' : 'default'}
          loading={overview.isLoading}
        />
        <KpiTile
          icon={UserPlus}
          label="Pacientes nuevos (30d)"
          value={overview.data?.newPatientsLast30d}
          hint={overview.data ? `Hoy: +${overview.data.totalsToday.orders} ordenes` : null}
          loading={overview.isLoading}
        />
      </div>

      {/* Timeline + Distribution */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarDays className="h-4 w-4" /> Actividad diaria
              </CardTitle>
              <CardDescription>Ordenes creadas vs entregadas</CardDescription>
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
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : timeline.isError ? (
              <p className="text-sm text-destructive">No se pudo cargar el timeline.</p>
            ) : (
              <DailyBars data={timeline.data ?? []} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" /> Estado de ordenes
            </CardTitle>
            <CardDescription>Distribucion actual</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.isLoading ? (
              <p className="text-sm text-muted-foreground">Cargando...</p>
            ) : overview.data ? (
              <StateDistribution data={overview.data.ordersByState} />
            ) : (
              <p className="text-sm text-destructive">Sin datos.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top tests + Top referencias */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Pruebas mas solicitadas
            </CardTitle>
            <CardDescription>Ultimos 30 dias · top 5</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.data?.topTests.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin ordenes en los ultimos 30 dias.</p>
            )}
            <ul className="space-y-2">
              {overview.data?.topTests.map((t) => (
                <li
                  key={t.testId}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <Badge variant="outline" className="font-mono">
                    {t.code}
                  </Badge>
                  <span className="flex-1 truncate">{t.name}</span>
                  <span className="font-semibold tabular-nums">{t.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" /> Referencias mas activas
            </CardTitle>
            <CardDescription>Ultimos 30 dias · top 5</CardDescription>
          </CardHeader>
          <CardContent>
            {overview.data?.topReferences.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Sin referencias con ordenes recientes.
              </p>
            )}
            <ul className="space-y-2">
              {overview.data?.topReferences.map((r) => (
                <li
                  key={r.referenceId}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm"
                >
                  <span className="flex-1 truncate font-medium">{r.name}</span>
                  <span className="font-semibold tabular-nums">{r.count}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button asChild variant="ghost" size="sm">
          <Link to="/admin/auditoria">Ver log de auditoria →</Link>
        </Button>
      </div>
    </div>
  );
}

// ---- helpers ----

interface KpiTileProps {
  icon: typeof Activity;
  label: string;
  value: number | undefined;
  hint?: string | null;
  tone?: 'default' | 'warning' | 'destructive';
  loading?: boolean;
}

function KpiTile({ icon: Icon, label, value, hint, tone = 'default', loading }: KpiTileProps) {
  const toneCls =
    tone === 'destructive'
      ? 'text-destructive'
      : tone === 'warning'
        ? 'text-amber-600'
        : 'text-primary';
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${toneCls}`}>
            {loading ? '—' : (value ?? 0)}
          </div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        <Icon className={`h-5 w-5 ${toneCls} opacity-70`} />
      </CardContent>
    </Card>
  );
}
