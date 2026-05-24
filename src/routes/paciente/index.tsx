import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardList, FileText, Info, Search } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
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

  const total = query.data?.total ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis examenes"
        description="Resultados que el laboratorio entrego a tu nombre. Puedes verlos en linea o descargarlos como PDF."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'examen disponible' : 'examenes disponibles'}
            </Badge>
          )
        }
      />

      {/* Aviso de uso medico */}
      <div className="flex items-start gap-3 rounded-lg border border-info/30 bg-info/5 px-4 py-3 text-sm">
        <Info className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <div>
          <p className="text-foreground">
            <span className="font-medium">Los resultados son de uso medico.</span> No se
            autointerprete: consulta siempre con el medico que ordeno los examenes.
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
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
              placeholder="Buscar por codigo o medico..."
              className="pl-9"
              aria-label="Buscar examenes"
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Codigo</TableHead>
                  <TableHead>Medico</TableHead>
                  <TableHead className="hidden w-[120px] md:table-cell">Estado</TableHead>
                  <TableHead className="hidden w-[120px] sm:table-cell">Fecha</TableHead>
                  <TableHead className="w-[110px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={5} iconHidden>
                    Cargando examenes...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={5}>No se pudieron cargar tus examenes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={5} icon={ClipboardList}>
                    {debouncedSearch
                      ? 'No hay examenes para esa busqueda.'
                      : 'Aun no hay examenes entregados a tu nombre. Cuando el laboratorio los entregue apareceran aqui.'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((o) => {
                    const meta = STATE_META[o.state];
                    return (
                      <TableRow key={o.id} className="group">
                        <TableCell>
                          <Link
                            to={`/paciente/${o.code}`}
                            className="font-mono text-xs font-semibold text-primary hover:underline"
                          >
                            {o.code}
                          </Link>
                        </TableCell>
                        <TableCell className="text-sm">
                          {o.requestingDoctor ?? (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                        </TableCell>
                        <TableCell className="hidden text-xs text-muted-foreground tabular-nums sm:table-cell">
                          {formatDate(o.deliveredAt ?? o.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void handleOpenPdf(o.code)}
                              aria-label={`Abrir PDF de ${o.code}`}
                              title="Abrir PDF"
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
                                to={`/paciente/${o.code}`}
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
