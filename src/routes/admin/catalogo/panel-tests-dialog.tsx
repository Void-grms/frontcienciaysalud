import { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';
import { reportFormError } from '@shared/lib/report-error';

import {
  useAddPanelTest,
  usePanelDetail,
  useRemovePanelTest,
  useTestsList,
} from '@features/catalog/hooks';

interface PanelTestsDialogProps {
  panelId: string | null;
  onOpenChange: (open: boolean) => void;
}

export function PanelTestsDialog({ panelId, onOpenChange }: PanelTestsDialogProps) {
  const open = panelId !== null;
  const panelQuery = usePanelDetail(panelId);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const testsQuery = useTestsList({
    page: 1,
    perPage: 20,
    status: 'active',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const addMut = useAddPanelTest();
  const removeMut = useRemovePanelTest();

  // Indice de pruebas ya asignadas para deshabilitar el boton de agregar y
  // evitar el roundtrip al backend solo para chocar contra el unique constraint.
  const assignedIds = useMemo(() => {
    const set = new Set<string>();
    panelQuery.data?.panelTests.forEach((pt) => set.add(pt.testId));
    return set;
  }, [panelQuery.data]);

  const handleAdd = async (testId: string) => {
    if (!panelId) return;
    try {
      const nextOrder = panelQuery.data?.panelTests.length ?? 0;
      await addMut.mutateAsync({ panelId, input: { testId, displayOrder: nextOrder } });
      toast.success('Prueba agregada al panel');
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleRemove = async (testId: string, testName: string) => {
    if (!panelId) return;
    try {
      await removeMut.mutateAsync({ panelId, testId });
      toast.success(`"${testName}" quitada del panel`);
    } catch (err) {
      reportFormError(err);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pruebas del panel</DialogTitle>
          <DialogDescription className="truncate">
            {panelQuery.data
              ? `${panelQuery.data.code} — ${panelQuery.data.name}`
              : 'Cargando...'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <section>
            <h3 className="mb-2 text-sm font-medium">Asignadas</h3>
            {panelQuery.isLoading && (
              <p className="text-sm text-muted-foreground">Cargando pruebas...</p>
            )}
            {panelQuery.data && panelQuery.data.panelTests.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aun no hay pruebas en este panel. Busca abajo y agregalas.
              </p>
            )}
            <ul className="space-y-1">
              {panelQuery.data?.panelTests.map((pt) => (
                <li
                  key={pt.id}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <span className="shrink-0 font-mono text-xs text-muted-foreground">
                    {pt.test.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm">{pt.test.name}</span>
                  <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                    {pt.test.resultType}
                    {pt.test.unit ? ` · ${pt.test.unit}` : ''}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => void handleRemove(pt.testId, pt.test.name)}
                    disabled={removeMut.isPending}
                    aria-label={`Quitar ${pt.test.name}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="mb-2 text-sm font-medium">Agregar pruebas</h3>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Busca por codigo o nombre..."
                className="pl-8"
              />
            </div>
            <ul className="mt-2 max-h-60 space-y-1 overflow-y-auto overflow-x-hidden rounded-md border">
              {testsQuery.isLoading && (
                <li className="px-3 py-2 text-sm text-muted-foreground">Cargando...</li>
              )}
              {testsQuery.data?.items.length === 0 && !testsQuery.isLoading && (
                <li className="px-3 py-2 text-sm text-muted-foreground">
                  No se encontraron pruebas activas con esa busqueda.
                </li>
              )}
              {testsQuery.data?.items.map((t) => {
                const already = assignedIds.has(t.id);
                return (
                  <li
                    key={t.id}
                    className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
                  >
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {t.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{t.name}</span>
                    <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                      {t.category?.name}
                    </span>
                    <Button
                      size="sm"
                      variant={already ? 'outline' : 'default'}
                      className="shrink-0"
                      disabled={already || addMut.isPending}
                      onClick={() => void handleAdd(t.id)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {already ? 'Ya en panel' : 'Agregar'}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        </DialogBody>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
