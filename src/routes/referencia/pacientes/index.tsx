import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { PageHeader } from '@shared/components/page-header';
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

import { useReferencePatients } from '@features/portal/hooks';

function age(birthDate: string | null): string {
  if (!birthDate) return '—';
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return '—';
  const now = new Date();
  let a = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--;
  return `${a} anos`;
}

function sexLabel(sex: string | null | undefined): string {
  if (sex === 'M') return 'Masculino';
  if (sex === 'F') return 'Femenino';
  if (sex === 'A') return 'Ambiguo';
  return '';
}

function patientInitials(firstName: string, lastName: string): string {
  return ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase() || '?';
}

export default function ReferencePatientsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const query = useReferencePatients(params);
  const total = query.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes derivados"
        description="Pacientes con al menos una orden derivada por tu clinica. El contador muestra cuantas ordenes entregadas o enmendadas tiene cada uno."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'paciente' : 'pacientes'}
            </Badge>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4">
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
              placeholder="Buscar por nombre, apellido o documento..."
              className="pl-9"
              aria-label="Buscar pacientes"
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Documento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden w-[140px] md:table-cell">Nacimiento</TableHead>
                  <TableHead className="w-[110px] text-right">Ordenes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={4} iconHidden>
                    Cargando pacientes...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={4}>No se pudieron cargar los pacientes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={4} icon={Users}>
                    {debouncedSearch
                      ? 'No hay pacientes para esa busqueda.'
                      : 'Tu clinica aun no ha derivado pacientes al laboratorio.'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {p.documentType}
                          </Badge>
                          <span className="font-mono text-xs tabular-nums">
                            {p.documentNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700"
                            aria-hidden
                          >
                            {patientInitials(p.firstName, p.lastName)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/referencia?patientId=${p.id}`}
                              className="block truncate font-medium text-foreground hover:text-primary hover:underline"
                            >
                              {p.lastName}, {p.firstName}
                            </Link>
                            <div className="truncate text-xs text-muted-foreground">
                              {age(p.birthDate)}
                              {p.sex && (
                                <>
                                  <span className="mx-1.5 text-border">·</span>
                                  {sexLabel(p.sex)}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground tabular-nums md:table-cell">
                        {formatDate(p.birthDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={p._count.orders > 0 ? 'subtle' : 'muted'}>
                          {p._count.orders}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
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
