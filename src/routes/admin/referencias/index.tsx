import { useState } from 'react';
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Referencias</h1>
        <p className="text-sm text-muted-foreground">
          Entidades externas (clinicas, policlinicos, medicos referentes) que solicitan ordenes y
          tienen acceso al portal de referencia.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de referencias</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} referencias registradas` : 'Cargando...'}
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nueva referencia
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, RUC o contacto..."
                className="pl-8"
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">RUC</TableHead>
                  <TableHead className="hidden lg:table-cell">Contacto</TableHead>
                  <TableHead className="w-[90px] text-right">Usuarios</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudieron cargar las referencias.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6}>No hay referencias con esos filtros.</TableEmpty>
                ) : (
                  query.data?.items.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.name}</TableCell>
                      <TableCell className="hidden font-mono text-xs text-muted-foreground md:table-cell">
                        {r.taxId ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="text-sm">{r.contactName ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.contactEmail ?? r.contactPhone ?? ''}
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {r._count?.users ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.status === 'active' ? 'success' : 'muted'}>
                          {r.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setUsersFor(r.id)}
                            aria-label={`Usuarios de ${r.name}`}
                            title="Usuarios del portal"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(r)}
                            aria-label={`Editar ${r.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(r)}
                            aria-label={`Eliminar ${r.name}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
