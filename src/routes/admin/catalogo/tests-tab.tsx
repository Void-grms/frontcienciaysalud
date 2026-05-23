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
import { useDebouncedValue } from '@shared/lib/use-debounced-value';
import { reportFormError } from '@shared/lib/report-error';

import {
  useCategoriesList,
  useDeleteTest,
  useTestsList,
} from '@features/catalog/hooks';
import type { CatalogStatus, ResultType, Test } from '@features/catalog/types';

import { TestDialog } from './test-dialog';

const RESULT_TYPE_LABEL: Record<ResultType, string> = {
  numeric: 'Numerica',
  qualitative: 'Cualitativa',
  text: 'Texto',
  observation: 'Observacion',
};

const STATUS_FILTERS: Array<{ value: 'all' | CatalogStatus; label: string }> = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
];

const RESULT_TYPE_FILTERS: Array<{ value: 'all' | ResultType; label: string }> = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'numeric', label: 'Numerica' },
  { value: 'qualitative', label: 'Cualitativa' },
  { value: 'text', label: 'Texto' },
  { value: 'observation', label: 'Observacion' },
];

export function TestsTab() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | CatalogStatus>('active');
  const [resultType, setResultType] = useState<'all' | ResultType>('all');
  const [categoryId, setCategoryId] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Test | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Test | null>(null);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(status !== 'all' ? { status } : {}),
    ...(resultType !== 'all' ? { resultType } : {}),
    ...(categoryId !== 'all' ? { categoryId } : {}),
  };

  const query = useTestsList(params);
  const categoriesQuery = useCategoriesList({ status: 'active', perPage: 100 });
  const deleteMut = useDeleteTest();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (t: Test) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      toast.success(`Prueba "${pendingDelete.name}" eliminada`);
      setPendingDelete(null);
    } catch (err) {
      reportFormError(err);
    }
  };

  const resetPage = () => setPage(1);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Pruebas</CardTitle>
            <CardDescription>
              Cada cambio genera una version historica; las ordenes existentes mantienen la version original.
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nueva prueba
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                placeholder="Buscar por codigo o nombre..."
                className="pl-8"
              />
            </div>
            <Select
              value={categoryId}
              onValueChange={(v) => {
                setCategoryId(v);
                resetPage();
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorias</SelectItem>
                {categoriesQuery.data?.items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Select
                value={resultType}
                onValueChange={(v) => {
                  setResultType(v as 'all' | ResultType);
                  resetPage();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_TYPE_FILTERS.map((rt) => (
                    <SelectItem key={rt.value} value={rt.value}>
                      {rt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status}
                onValueChange={(v) => {
                  setStatus(v as 'all' | CatalogStatus);
                  resetPage();
                }}
              >
                <SelectTrigger>
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
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[110px]">Codigo</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Categoria</TableHead>
                  <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                  <TableHead className="hidden lg:table-cell">Unidad</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="w-[110px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={7}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={7}>No se pudieron cargar las pruebas.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={7}>No hay pruebas para los filtros actuales.</TableEmpty>
                ) : (
                  query.data?.items.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{t.name}</div>
                        {t.shortName && (
                          <div className="text-xs text-muted-foreground">{t.shortName}</div>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          {t.category?.color && (
                            <span
                              className="inline-block h-3 w-3 rounded-sm"
                              style={{ background: t.category.color }}
                              aria-hidden
                            />
                          )}
                          <span>{t.category?.name ?? '—'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">{RESULT_TYPE_LABEL[t.resultType]}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {t.unit ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={t.status === 'active' ? 'success' : 'muted'}>
                          {t.status === 'active' ? 'Activa' : 'Inactiva'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(t)}
                            aria-label={`Editar ${t.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(t)}
                            aria-label={`Eliminar ${t.name}`}
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

      <TestDialog open={dialogOpen} onOpenChange={setDialogOpen} test={editing} />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar prueba</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar &quot;{pendingDelete?.name}&quot;. Los resultados ya emitidos se mantienen
              porque las ordenes guardan una snapshot de la version. La prueba quedara como inactiva.
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
