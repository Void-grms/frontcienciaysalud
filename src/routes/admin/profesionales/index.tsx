import { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Profesionales</h1>
        <p className="text-sm text-muted-foreground">
          Profesionales que firman los informes. Cada uno tiene una imagen de firma que se incrusta
          al final del PDF y se asocia por defecto a una categoria o prueba.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de profesionales</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} profesionales` : 'Cargando...'}
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo profesional
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
                placeholder="Buscar por nombre, titulo o colegiatura..."
                className="pl-8"
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Firma</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Titulo</TableHead>
                  <TableHead className="hidden lg:table-cell">Colegiatura</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="w-[110px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudieron cargar los profesionales.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6}>No hay profesionales con esos filtros.</TableEmpty>
                ) : (
                  query.data?.items.map((p) => {
                    const sigUrl = storageUrl(p.signatureStorageKey);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="flex h-10 w-16 items-center justify-center overflow-hidden rounded border bg-muted/40">
                            {sigUrl ? (
                              <img
                                src={sigUrl}
                                alt={`Firma de ${p.fullName}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-[10px] text-muted-foreground">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{p.fullName}</TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell">
                          {p.professionalTitle ?? '—'}
                        </TableCell>
                        <TableCell className="hidden font-mono text-xs text-muted-foreground lg:table-cell">
                          {p.licenseNumber ?? '—'}
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
                              onClick={() => openEdit(p)}
                              aria-label={`Editar ${p.fullName}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setPendingDelete(p)}
                              aria-label={`Eliminar ${p.fullName}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
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
