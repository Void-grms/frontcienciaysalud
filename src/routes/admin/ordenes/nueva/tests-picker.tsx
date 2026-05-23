import { useMemo, useState } from 'react';
import { FlaskConical, LayoutPanelLeft, Plus, Search, Trash2 } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { usePanelsList, useTestsList } from '@features/catalog/hooks';
import type { PanelListItem, Test } from '@features/catalog/types';

// Las selecciones se modelan como dos sets: pruebas individuales y paneles.
// El backend resuelve internamente las pruebas que pertenecen a un panel; aqui
// solo mostramos al usuario que panel agrego.
export interface SelectedTest {
  testId: string;
  code: string;
  name: string;
  // Si es de panel, guardamos el nombre del panel para etiquetarlo en la UI.
  panelName?: string;
}

export interface SelectedPanel {
  panelId: string;
  code: string;
  name: string;
  testsCount: number;
}

interface TestsPickerProps {
  selectedTests: SelectedTest[];
  selectedPanels: SelectedPanel[];
  onChangeTests: (next: SelectedTest[]) => void;
  onChangePanels: (next: SelectedPanel[]) => void;
}

export function TestsPicker({
  selectedTests,
  selectedPanels,
  onChangeTests,
  onChangePanels,
}: TestsPickerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [tab, setTab] = useState<'tests' | 'panels'>('tests');

  const testsQuery = useTestsList({
    page: 1,
    perPage: 30,
    status: 'active',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const panelsQuery = usePanelsList({
    page: 1,
    perPage: 20,
    status: 'active',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const selectedTestIds = useMemo(
    () => new Set(selectedTests.map((t) => t.testId)),
    [selectedTests],
  );
  const selectedPanelIds = useMemo(
    () => new Set(selectedPanels.map((p) => p.panelId)),
    [selectedPanels],
  );

  const addTest = (t: Test) => {
    if (selectedTestIds.has(t.id)) return;
    onChangeTests([...selectedTests, { testId: t.id, code: t.code, name: t.name }]);
  };
  const removeTest = (id: string) => {
    onChangeTests(selectedTests.filter((t) => t.testId !== id));
  };
  const addPanel = (p: PanelListItem) => {
    if (selectedPanelIds.has(p.id)) return;
    onChangePanels([
      ...selectedPanels,
      {
        panelId: p.id,
        code: p.code,
        name: p.name,
        testsCount: p._count?.panelTests ?? 0,
      },
    ]);
  };
  const removePanel = (id: string) => {
    onChangePanels(selectedPanels.filter((p) => p.panelId !== id));
  };

  const totalSelected = selectedTests.length + selectedPanels.length;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar pruebas o paneles..."
          className="pl-8"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'tests' | 'panels')}>
        <TabsList>
          <TabsTrigger value="tests">
            <FlaskConical className="h-4 w-4" /> Pruebas
          </TabsTrigger>
          <TabsTrigger value="panels">
            <LayoutPanelLeft className="h-4 w-4" /> Paneles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests">
          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border bg-background">
            {testsQuery.isLoading && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Cargando...</li>
            )}
            {testsQuery.data?.items.length === 0 && !testsQuery.isLoading && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</li>
            )}
            {testsQuery.data?.items.map((t) => {
              const already = selectedTestIds.has(t.id);
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
                >
                  <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
                  <span className="flex-1 truncate text-sm">{t.name}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">
                    {t.category?.name}
                    {t.unit ? ` · ${t.unit}` : ''}
                  </span>
                  <Button
                    size="sm"
                    variant={already ? 'outline' : 'default'}
                    onClick={() => addTest(t)}
                    disabled={already}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {already ? 'Agregada' : 'Agregar'}
                  </Button>
                </li>
              );
            })}
          </ul>
        </TabsContent>

        <TabsContent value="panels">
          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border bg-background">
            {panelsQuery.isLoading && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Cargando...</li>
            )}
            {panelsQuery.data?.items.length === 0 && !panelsQuery.isLoading && (
              <li className="px-3 py-2 text-sm text-muted-foreground">Sin resultados.</li>
            )}
            {panelsQuery.data?.items.map((p) => {
              const already = selectedPanelIds.has(p.id);
              const count = p._count?.panelTests ?? 0;
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 border-b px-3 py-2 last:border-b-0"
                >
                  <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
                  <span className="flex-1 truncate text-sm">{p.name}</span>
                  <Badge variant="outline" className="hidden sm:inline-flex">
                    {count} {count === 1 ? 'prueba' : 'pruebas'}
                  </Badge>
                  <Button
                    size="sm"
                    variant={already ? 'outline' : 'default'}
                    onClick={() => addPanel(p)}
                    disabled={already || count === 0}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {already ? 'Agregado' : 'Agregar'}
                  </Button>
                </li>
              );
            })}
          </ul>
        </TabsContent>
      </Tabs>

      <div className="rounded-md border bg-muted/30 p-3">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-medium">Seleccion actual</h4>
          <span className="text-xs text-muted-foreground">
            {totalSelected} {totalSelected === 1 ? 'item' : 'items'}
          </span>
        </div>
        {totalSelected === 0 && (
          <p className="text-sm text-muted-foreground">
            Aun no se han agregado pruebas ni paneles.
          </p>
        )}
        <ul className="space-y-1">
          {selectedPanels.map((p) => (
            <li
              key={`panel-${p.panelId}`}
              className="flex items-center gap-2 rounded border bg-background px-2 py-1.5"
            >
              <LayoutPanelLeft className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs text-muted-foreground">{p.code}</span>
              <span className="flex-1 truncate text-sm">{p.name}</span>
              <Badge variant="outline">{p.testsCount} pruebas</Badge>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePanel(p.panelId)}
                aria-label={`Quitar ${p.name}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
          {selectedTests.map((t) => (
            <li
              key={`test-${t.testId}`}
              className="flex items-center gap-2 rounded border bg-background px-2 py-1.5"
            >
              <FlaskConical className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs text-muted-foreground">{t.code}</span>
              <span className="flex-1 truncate text-sm">{t.name}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeTest(t.testId)}
                aria-label={`Quitar ${t.name}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
