import { useState } from 'react';
import { Building2, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
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
import { useDebouncedValue } from '@shared/lib/use-debounced-value';
import { reportFormError } from '@shared/lib/report-error';

import { useDeleteReference, useReferencesList } from '@features/references/hooks';
import type {
  ReferenceListItem,
  ReferenceStatus,
} from '@features/references/types';

import { ReferenceDialog } from './reference-dialog';
import { ReferenceUsersDialog } from './reference-users-dialog';

const STATUS_FILTERS: Array<{ value: 'all' | ReferenceStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
];

export default function ReferenciasPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | ReferenceStatus>('active');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReferenceListItem | null>(null);
  const [usersFor, setUsersFor] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ReferenceListItem | null>(null);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== 'all' ? { status } : {}),
  };

  const query = useReferencesList(params);
  const deleteMut = useDeleteReference();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (r: ReferenceListItem) => {
    setEditing(r);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      toast.success(`Referencia "${pendingDelete.name}" eliminada`);
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
        title="Referencias"
        description="Entidades externas (clinicas, policlinicos, medicos referentes) que solicitan ordenes y tienen acceso al portal de referencia."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'referencia' : 'referencias'} encontradas
            </Badge>
          )
        }
        actions={
          <Button onClick={openCreate}>
            <Plus /> Nueva referencia
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
                placeholder="Buscar por nombre, RUC o contacto..."
                className="pl-9"
                aria-label="Buscar referencias"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as 'all' | ReferenceStatus);
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
                  <TableHead>Referencia</TableHead>
                  <TableHead className="hidden md:table-cell">RUC</TableHead>
                  <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                  <TableHead className="w-[100px] text-right">Usuarios</TableHead>
                  <TableHead className="w-[100px]">Estado</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6} iconHidden>
                    Cargando referencias...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudieron cargar las referencias.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6} icon={Building2}>
                    {hasFilters
                      ? 'No hay referencias para los filtros aplicados.'
                      : 'Aun no hay referencias registradas. Crea la primera con "Nueva referencia".'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-700"
                            aria-hidden
                          >
                            <Building2 className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">{r.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground tabular-nums md:table-cell">
                        {r.taxId ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="space-y-0.5 text-xs leading-tight">
                          <div className="text-foreground">{r.contactName ?? '—'}</div>
                          <div className="text-muted-foreground">
                            {r.contactEmail ?? r.contactPhone ?? ''}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {r._count?.users ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'active' ? 'success' : 'muted'}>
                          {r.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setUsersFor(r.id)}
                            aria-label={`Usuarios de ${r.name}`}
                            title="Usuarios del portal"
                          >
                            <Users />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(r)}
                            aria-label={`Editar ${r.name}`}
                            title="Editar"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPendingDelete(r)}
                            aria-label={`Eliminar ${r.name}`}
                            title="Eliminar"
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </div>
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

      <ReferenceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        reference={editing}
        onCreated={(id) => setUsersFor(id)}
      />

      <ReferenceUsersDialog
        referenceId={usersFor}
        onOpenChange={(open) => {
          if (!open) setUsersFor(null);
        }}
      />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar referencia</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar &quot;{pendingDelete?.name}&quot;. Sus usuarios quedan bloqueados y las
              ordenes historicas mantienen el vinculo para reportes. La referencia ya no aparecera
              en nuevas ordenes.
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
