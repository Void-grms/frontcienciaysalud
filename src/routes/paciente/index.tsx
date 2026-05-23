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
import { patientPortalApi } from '@features/portal/api';
import { usePatientOrders } from '@features/portal/hooks';

export default function PatientOrdersList() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  };
  const query = usePatientOrders(params);

  const handleOpenPdf = async (idOrCode: string) => {
    try {
      const { blob } = await patientPortalApi.downloadPdf(idOrCode);
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
        <h1 className="text-2xl font-semibold">Mis examenes</h1>
        <p className="text-sm text-muted-foreground">
          Aqui veras los informes que el laboratorio entrego. Puedes ver el PDF en linea o
          descargarlo a tu dispositivo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de ordenes</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.total} ordenes disponibles` : 'Cargando...'}
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
              placeholder="Buscar por codigo o medico..."
              className="pl-8"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[160px]">Codigo</TableHead>
                  <TableHead>Medico</TableHead>
                  <TableHead className="hidden md:table-cell w-[120px]">Estado</TableHead>
                  <TableHead className="hidden sm:table-cell w-[120px]">Entregado</TableHead>
                  <TableHead className="w-[100px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={5}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={5}>No se pudieron cargar tus examenes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={5}>
                    Aun no hay examenes entregados a tu nombre. Cuando el laboratorio los entregue
                    apareceran aqui.
                  </TableEmpty>
                ) : (
                  query.data?.items.map((o) => {
                    const meta = STATE_META[o.state];
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">
                          <Link
                            to={`/paciente/${o.code}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {o.code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">{o.requestingDoctor ?? '—'}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                          {formatDate(o.deliveredAt ?? o.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button asChild variant="ghost" size="icon">
                              <Link
                                to={`/paciente/${o.code}`}
                                aria-label={`Ver detalle de ${o.code}`}
                                title="Ver detalle"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => void handleOpenPdf(o.code)}
                              aria-label={`Abrir PDF de ${o.code}`}
                              title="Abrir PDF"
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
