import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
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
  return `${a} a`;
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pacientes derivados</h1>
        <p className="text-sm text-muted-foreground">
          Pacientes con al menos una orden derivada por tu referencia. El contador muestra cuantas
          ordenes entregadas o enmendadas tiene cada uno.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.total} pacientes` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, apellido o documento..."
              className="pl-8"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Documento</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell w-[120px]">Nacimiento</TableHead>
                  <TableHead className="w-[100px] text-right">Ordenes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={4}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={4}>No se pudieron cargar los pacientes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={4}>
                    No hay pacientes asociados a tu referencia todavia.
                  </TableEmpty>
                ) : (
                  query.data?.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {p.documentType}
                          </Badge>
                          <span className="font-mono text-xs">{p.documentNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={`/referencia?patientId=${p.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {p.lastName}, {p.firstName}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {age(p.birthDate)}
                          {p.sex
                            ? ` · ${p.sex === 'M' ? 'Masculino' : p.sex === 'F' ? 'Femenino' : 'Ambiguo'}`
                            : ''}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {formatDate(p.birthDate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <Badge variant="muted">{p._count.orders}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
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
