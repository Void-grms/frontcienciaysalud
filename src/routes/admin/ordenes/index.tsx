import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Plus, Search } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Ordenes</h1>
          <p className="text-sm text-muted-foreground">
            Cada orden agrupa pruebas para un paciente; sigue el flujo borrador → en proceso →
            validada → entregada. La captura de resultados se realiza desde el detalle.
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/ordenes/nueva">
            <Plus className="h-4 w-4" /> Nueva orden
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            La busqueda cubre codigo de orden, paciente (nombre, apellido, documento) y medico
            solicitante.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Codigo, paciente, medico..."
                className="pl-8"
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
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
                <Input
                  type="date"
                  value={to}
                  onChange={(e) => {
                    setTo(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.total} ordenes encontradas` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Codigo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Referencia</TableHead>
                  <TableHead className="hidden lg:table-cell">Medico</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="hidden xl:table-cell w-[130px]">Creada</TableHead>
                  <TableHead className="w-[120px] text-right">Items / Resultados</TableHead>
                  <TableHead className="w-[80px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={8}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={8}>No se pudieron cargar las ordenes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={8}>No hay ordenes para los filtros actuales.</TableEmpty>
                ) : (
                  query.data?.items.map((o) => {
                    const meta = STATE_META[o.state];
                    const count = o._count?.items ?? 0;
                    const done = o._count?.results ?? 0;
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            to={`/admin/ordenes/${o.code}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {o.code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {o.patient.lastName}, {o.patient.firstName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {o.patient.documentNumber}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {o.reference?.name ?? '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground">
                          {o.requestingDoctor ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">
                          {formatDate(o.createdAt)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          <span className={done < count ? 'text-amber-700' : 'text-emerald-700'}>
                            {done}/{count}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button asChild variant="ghost" size="icon">
                            <Link to={`/admin/ordenes/${o.code}`} aria-label={`Ver ${o.code}`}>
                              <Eye className="h-4 w-4" />
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

          {query.data && (
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
