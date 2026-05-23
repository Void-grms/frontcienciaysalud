import { useState } from 'react';
import { Pencil, Plus, Search, Stethoscope, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Pager } from '@shared/components/pager';
import { storageUrl } from '@shared/api/storage-url';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';
import { reportFormError } from '@shared/lib/report-error';

import {
  useDeleteProfessional,
  useProfessionalsList,
} from '@features/professionals/hooks';
import type { Professional, ProfessionalStatus } from '@features/professionals/types';

import { ProfessionalDialog } from './professional-dialog';

const STATUS_FILTERS: Array<{ value: 'all' | ProfessionalStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

export default function ProfesionalesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ProfessionalStatus>('active');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Professional | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Professional | null>(null);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== 'all' ? { status } : {}),
  };

  const query = useProfessionalsList(params);
  const deleteMut = useDeleteProfessional();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Professional) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      toast.success(`Profesional "${pendingDelete.fullName}" eliminado`);
      setPendingDelete(null);
    } catch (err) {
      reportFormError(err);
    }
  };

  const total = query.data?.total ?? 0;
  const hasFilters = !!debouncedSearch || status !== 'active';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profesionales"
        description="Profesionales que firman los informes. Cada uno tiene una imagen de firma que se incrusta al final del PDF."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'profesional' : 'profesionales'}
            </Badge>
          )
        }
        actions={
          <Button onClick={openCreate}>
            <Plus /> Nuevo profesional
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4 p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
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
                placeholder="Buscar por nombre, titulo o colegiatura..."
                className="pl-9"
                aria-label="Buscar profesionales"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as 'all' | ProfessionalStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Firma</TableHead>
                  <TableHead>Profesional</TableHead>
                  <TableHead className="hidden md:table-cell">Titulo</TableHead>
                  <TableHead className="hidden lg:table-cell">Colegiatura</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[110px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6} iconHidden>
                    Cargando profesionales...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudieron cargar los profesionales.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6} icon={Stethoscope}>
                    {hasFilters
                      ? 'No hay profesionales para los filtros aplicados.'
                      : 'Aun no hay profesionales registrados. Crea el primero con "Nuevo profesional".'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((p) => {
                    const sigUrl = storageUrl(p.signatureStorageKey);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded border border-border bg-muted/30">
                            {sigUrl ? (
                              <img
                                src={sigUrl}
                                alt={`Firma de ${p.fullName}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground/60">sin firma</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div
                              className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700"
                              aria-hidden
                            >
                              <Stethoscope className="size-4" />
                            </div>
                            <div className="min-w-0 font-medium truncate">{p.fullName}</div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-sm text-muted-foreground md:table-cell">
                          {p.professionalTitle ?? '—'}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground tabular-nums lg:table-cell">
                          {p.licenseNumber ?? '—'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.status === 'active' ? 'success' : 'muted'}>
                            {p.status === 'active' ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => openEdit(p)}
                              aria-label={`Editar ${p.fullName}`}
                              title="Editar"
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setPendingDelete(p)}
                              aria-label={`Eliminar ${p.fullName}`}
                              title="Eliminar"
                            >
                              <Trash2 className="text-destructive" />
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

      <ProfessionalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        professional={editing}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar profesional</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a &quot;{pendingDelete?.fullName}&quot;. Las ordenes ya validadas
              mantienen el snapshot del firmante; el profesional queda inactivo y no se asignara a
              nuevas pruebas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
