import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, FileText, Search } from 'lucide-react';

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
import { reportFormError } from '@shared/lib/report-error';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { STATE_META } from '@features/orders/state-meta';
import { referencePortalApi } from '@features/portal/api';
import { useReferenceOrders } from '@features/portal/hooks';
import type { OrderState } from '@features/orders/types';

// El portal de referencia ve solo las ordenes derivadas (filtrado por
// ownership en el backend). Aqui le damos al usuario un filtro de estado
// para que pueda separar las que estan en proceso de las ya entregadas.
const STATE_FILTERS: Array<{ value: 'all' | OrderState; label: string }> = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'in_progress', label: 'En proceso' },
  { value: 'validated', label: 'Validada' },
  { value: 'delivered', label: 'Entregada' },
  { value: 'amended', label: 'Enmendada' },
];

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ordenes derivadas</h1>
        <p className="text-sm text-muted-foreground">
          Aqui veras todas las ordenes derivadas por tu referencia. Puedes descargar el PDF cuando
          el laboratorio valide los resultados.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
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
            {query.data ? `${query.data.total} ordenes derivadas` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Codigo</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Medico</TableHead>
                  <TableHead className="w-[120px]">Estado</TableHead>
                  <TableHead className="hidden lg:table-cell w-[120px]">Creada</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudieron cargar las ordenes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6}>No hay ordenes para los filtros actuales.</TableEmpty>
                ) : (
                  query.data?.items.map((o) => {
                    const meta = STATE_META[o.state];
                    const canDownload =
                      o.state === 'delivered' || o.state === 'amended' || o.state === 'validated';
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            to={`/referencia/${o.code}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {o.code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-sm">
                            {o.patient.lastName}, {o.patient.firstName}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {o.patient.documentNumber}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {o.requestingDoctor ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {formatDate(o.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon">
                              <Link
                                to={`/referencia/${o.code}`}
                                aria-label={`Ver ${o.code}`}
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleOpenPdf(o.code)}
                              disabled={!canDownload}
                              aria-label={`PDF de ${o.code}`}
                              title={canDownload ? 'Abrir PDF' : 'PDF aun no disponible'}
                            >
                              <FileText className="h-4 w-4" />
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
