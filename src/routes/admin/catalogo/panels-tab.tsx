import { useState } from 'react';
import { ListChecks, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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

import { useDeletePanel, usePanelsList } from '@features/catalog/hooks';
import type { CatalogStatus, PanelListItem } from '@features/catalog/types';

import { PanelCreateDialog } from './panel-create-dialog';
import { PanelTestsDialog } from './panel-tests-dialog';

const STATUS_FILTERS: Array<{ value: 'all' | CatalogStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
];

export function PanelsTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CatalogStatus>('active');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<PanelListItem | null>(null);
  const [managePanelId, setManagePanelId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PanelListItem | null>(null);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== 'all' ? { status } : {}),
  };

  const query = usePanelsList(params);
  const deleteMut = useDeletePanel();

  const openCreate = () => {
    setEditing(null);
    setCreateOpen(true);
  };
  const openEdit = (p: PanelListItem) => {
    setEditing(p);
    setCreateOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      toast.success(`Panel "${pendingDelete.name}" eliminado`);
      setPendingDelete(null);
    } catch (err) {
      reportFormError(err);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Paneles</CardTitle>
            <CardDescription>
              Agrupaciones de pruebas que se solicitan juntas. Al crear un panel se pueden agregar
              pruebas existentes desde el catalogo.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo panel
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
                placeholder="Buscar por codigo o nombre..."
                className="pl-8"
              />
            </div>
            <Select
              value={status}
              onValueChange={(v) => {
                setStatus(v as 'all' | CatalogStatus);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTERS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Descripcion</TableHead>
                  <TableHead className="w-[100px] text-right">Pruebas</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="w-[150px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudieron cargar los paneles.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6}>No hay paneles para los filtros actuales.</TableEmpty>
                ) : (
                  query.data?.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.code}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="hidden max-w-[320px] truncate text-muted-foreground md:table-cell">
                        {p.description ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {p._count?.panelTests ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={p.status === 'active' ? 'success' : 'muted'}>
                          {p.status === 'active' ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setManagePanelId(p.id)}
                            aria-label={`Gestionar pruebas de ${p.name}`}
                          >
                            <ListChecks className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            aria-label={`Editar ${p.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(p)}
                            aria-label={`Eliminar ${p.name}`}
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

      <PanelCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        panel={editing}
        onCreated={(id) => setManagePanelId(id)}
      />

      <PanelTestsDialog
        panelId={managePanelId}
        onOpenChange={(open) => {
          if (!open) setManagePanelId(null);
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
            <AlertDialogTitle>Eliminar panel</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar &quot;{pendingDelete?.name}&quot;. Las ordenes que ya lo usaron mantienen
              sus pruebas individuales; el panel queda desactivado y no aparece en nuevas ordenes.
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
    </>
  );
}
