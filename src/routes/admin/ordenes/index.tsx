import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList, Plus, Search, X } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { PageHeader } from '@shared/components/page-header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from '@shared/components/ui/table';
import { Pager } from '@shared/components/pager';
import { cn } from '@shared/lib/cn';
import { formatDate } from '@shared/lib/format-date';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { useOrdersList } from '@features/orders/hooks';
import { STATE_META } from '@features/orders/state-meta';
import type { OrderState } from '@features/orders/types';

const STATE_FILTERS: Array<{ value: 'all' | OrderState; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'validated', label: 'Validada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'amended', label: 'Enmendada' },
  { value: 'cancelled', label: 'Anulada' },
];

function ProgressInline({ done, total }: { done: number; total: number }) {
  if (total === 0) return <span className="text-muted-foreground">0/0</span>;
  const pct = (done / total) * 100;
  const complete = done === total;
  return (
    <div className="flex items-center justify-end gap-2">
      <div className="h-1.5 w-12 overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full transition-all', complete ? 'bg-success' : 'bg-warning')}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <span className={cn('tabular-nums', complete ? 'text-success' : 'text-foreground')}>
        {done}/{total}
      </span>
    </div>
  );
}

function patientInitials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?';
}

export default function OrdenesListPage() {
  const [search, setSearch] = useState('');
  const [state, setState] = useState<'all' | OrderState>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(state !== 'all' ? { state } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };

  const query = useOrdersList(params);
  const total = query.data?.total ?? 0;
  const hasFilters = !!debouncedSearch || state !== 'all' || !!from || !!to;

  const clearFilters = () => {
    setSearch('');
    setState('all');
    setFrom('');
    setTo('');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ordenes"
        description="Cada orden agrupa pruebas para un paciente; sigue el flujo borrador → en proceso → validada → entregada."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'orden encontrada' : 'ordenes encontradas'}
            </Badge>
          )
        }
        actions={
          <Button asChild>
            <Link to="/admin/ordenes/nueva">
              <Plus /> Nueva orden
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_140px_140px_auto]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Codigo, paciente, medico..."
                className="pl-9"
                aria-label="Buscar ordenes"
              />
            </div>
            <Select
              value={state}
              onValueChange={(v) => {
                setState(v as 'all' | OrderState);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATE_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Desde</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="w-full lg:w-auto"
              >
                <X /> Limpiar
              </Button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Codigo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Referencia</TableHead>
                  <TableHead className="hidden lg:table-cell">Medico</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="hidden w-[120px] xl:table-cell">Creada</TableHead>
                  <TableHead className="w-[130px] text-right">Resultados</TableHead>
                  <TableHead className="w-[48px]" aria-label="Acciones" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={8} iconHidden>
                    Cargando ordenes...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={8}>No se pudieron cargar las ordenes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={8} icon={ClipboardList}>
                    {hasFilters
                      ? 'No hay ordenes para los filtros aplicados.'
                      : 'Aun no hay ordenes registradas. Crea la primera con "Nueva orden".'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((o) => {
                    const meta = STATE_META[o.state];
                    const count = o._count?.items ?? 0;
                    const done = o._count?.results ?? 0;
                    return (
                      <TableRow key={o.id} className="group">
                        <TableCell>
                          <Link
                            to={`/admin/ordenes/${o.code}`}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                          >
                            {o.code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <div
                              className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-50 text-[10px] font-semibold text-primary-700"
                              aria-hidden
                            >
                              {patientInitials(o.patient.firstName, o.patient.lastName)}
                            </div>
                            <div className="min-w-0">
                              <div className="truncate font-medium">
                                {o.patient.lastName}, {o.patient.firstName}
                              </div>
                              <div className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
                                {o.patient.documentNumber}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          <span className="line-clamp-1">{o.reference?.name ?? '—'}</span>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground lg:table-cell">
                          <span className="line-clamp-1">{o.requestingDoctor ?? '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground xl:table-cell">
                          {formatDate(o.createdAt)}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <ProgressInline done={done} total={count} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon-sm"
                            className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                          >
                            <Link
                              to={`/admin/ordenes/${o.code}`}
                              aria-label={`Ver detalle de ${o.code}`}
                            >
                              <ChevronRight />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {query.data && query.data.items.length > 0 && (
            <Pager
              page={query.data.page}
              perPage={query.data.perPage}
              total={query.data.total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
