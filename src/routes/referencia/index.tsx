import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList, FileText, Search, X } from 'lucide-react';

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
import { formatDate } from '@shared/lib/format-date';
import { reportFormError } from '@shared/lib/report-error';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { STATE_META } from '@features/orders/state-meta';
import { referencePortalApi } from '@features/portal/api';
import { useReferenceOrders } from '@features/portal/hooks';
import type { OrderState } from '@features/orders/types';

const STATE_FILTERS: Array<{ value: 'all' | OrderState; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'validated', label: 'Validada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'amended', label: 'Enmendada' },
];

function patientInitials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?';
}

export default function ReferenceOrdersList() {
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
  const query = useReferenceOrders(params);
  const hasFilters = !!debouncedSearch || state !== 'all' || !!from || !!to;
  const total = query.data?.total ?? 0;

  const handleOpenPdf = async (idOrCode: string) => {
    try {
      const { blob } = await referencePortalApi.downloadPdf(idOrCode);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch (err) {
      reportFormError(err);
    }
  };

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
        title="Ordenes derivadas"
        description="Ordenes que tu clinica derivo al laboratorio. Puedes descargar el PDF cuando el laboratorio valide los resultados."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'orden' : 'ordenes'}
            </Badge>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
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

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Codigo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Medico</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="hidden w-[110px] lg:table-cell">Creada</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6} iconHidden>
                    Cargando ordenes...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudieron cargar las ordenes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6} icon={ClipboardList}>
                    {hasFilters
                      ? 'No hay ordenes para los filtros aplicados.'
                      : 'Aun no se han derivado ordenes desde tu clinica.'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((o) => {
                    const meta = STATE_META[o.state];
                    const canDownload =
                      o.state === 'delivered' || o.state === 'amended' || o.state === 'validated';
                    return (
                      <TableRow key={o.id} className="group">
                        <TableCell>
                          <Link
                            to={`/referencia/${o.code}`}
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
                          <span className="line-clamp-1">{o.requestingDoctor ?? '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground tabular-nums lg:table-cell">
                          {formatDate(o.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void handleOpenPdf(o.code)}
                              disabled={!canDownload}
                              aria-label={`PDF de ${o.code}`}
                              title={canDownload ? 'Abrir PDF' : 'PDF aun no disponible'}
                            >
                              <FileText />
                            </Button>
                            <Button
                              asChild
                              variant="ghost"
                              size="icon-sm"
                              className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                            >
                              <Link
                                to={`/referencia/${o.code}`}
                                aria-label={`Ver detalle de ${o.code}`}
                                title="Ver detalle"
                              >
                                <ChevronRight />
                              </Link>
                            </Button>
                          </div>
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
