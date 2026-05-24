import { useMemo, useState } from 'react';
import {
  Check,
  FlaskConical,
  LayoutPanelLeft,
  Loader2,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { cn } from '@shared/lib/cn';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { usePanelsList, useTestsList } from '@features/catalog/hooks';
import type { PanelListItem, Test } from '@features/catalog/types';

export interface SelectedTest {
  testId: string;
  code: string;
  name: string;
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
  const isFetching = testsQuery.isFetching || panelsQuery.isFetching;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por codigo o nombre..."
          className="pl-9"
          aria-label="Buscar pruebas o paneles"
        />
        {isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'tests' | 'panels')} className="space-y-3">
        <TabsList>
          <TabsTrigger value="tests">
            <FlaskConical /> Pruebas
          </TabsTrigger>
          <TabsTrigger value="panels">
            <LayoutPanelLeft /> Paneles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="mt-0">
          <div className="overflow-hidden rounded-lg border border-border">
            <ul className="max-h-80 divide-y divide-border overflow-y-auto bg-card">
              {testsQuery.isLoading && (
                <li className="px-3 py-3 text-sm text-muted-foreground">Cargando pruebas...</li>
              )}
              {testsQuery.data?.items.length === 0 && !testsQuery.isLoading && (
                <li className="flex flex-col items-center gap-1.5 py-8 text-center">
                  <FlaskConical className="size-6 text-muted-foreground/60" aria-hidden />
                  <p className="text-sm text-muted-foreground">Sin resultados.</p>
                </li>
              )}
              {testsQuery.data?.items.map((t) => {
                const already = selectedTestIds.has(t.id);
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      onClick={() => addTest(t)}
                      disabled={already}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        already
                          ? 'bg-success/5 cursor-default'
                          : 'hover:bg-muted/50 focus-visible:bg-muted/50',
                      )}
                    >
                      <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                        {t.code}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium">{t.name}</span>
                      <span className="hidden text-[11px] text-muted-foreground sm:inline">
                        {t.category?.name}
                        {t.unit && (
                          <>
                            <span className="mx-1.5 text-border">·</span>
                            {t.unit}
                          </>
                        )}
                      </span>
                      {already ? (
                        <Badge variant="success" className="gap-1">
                          <Check className="size-3" /> Agregada
                        </Badge>
                      ) : (
                        <span className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Plus className="size-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="panels" className="mt-0">
          <div className="overflow-hidden rounded-lg border border-border">
            <ul className="max-h-80 divide-y divide-border overflow-y-auto bg-card">
              {panelsQuery.isLoading && (
                <li className="px-3 py-3 text-sm text-muted-foreground">Cargando paneles...</li>
              )}
              {panelsQuery.data?.items.length === 0 && !panelsQuery.isLoading && (
                <li className="flex flex-col items-center gap-1.5 py-8 text-center">
                  <LayoutPanelLeft className="size-6 text-muted-foreground/60" aria-hidden />
                  <p className="text-sm text-muted-foreground">Sin paneles disponibles.</p>
                </li>
              )}
              {panelsQuery.data?.items.map((p) => {
                const already = selectedPanelIds.has(p.id);
                const count = p._count?.panelTests ?? 0;
                const disabled = already || count === 0;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => addPanel(p)}
                      disabled={disabled}
                      className={cn(
                        'flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        already
                          ? 'bg-success/5 cursor-default'
                          : count === 0
                            ? 'cursor-not-allowed opacity-60'
                            : 'hover:bg-muted/50 focus-visible:bg-muted/50',
                      )}
                    >
                      <span className="w-16 shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
                        {p.code}
                      </span>
                      <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                      <Badge variant="outline" className="hidden tabular-nums sm:inline-flex">
                        {count} {count === 1 ? 'prueba' : 'pruebas'}
                      </Badge>
                      {already ? (
                        <Badge variant="success" className="gap-1">
                          <Check className="size-3" /> Agregado
                        </Badge>
                      ) : (
                        <span className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                          <Plus className="size-3.5" />
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </TabsContent>
      </Tabs>

      {/* Seleccion actual */}
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Seleccion actual</h4>
          <Badge variant={totalSelected > 0 ? 'subtle' : 'muted'}>
            {totalSelected} {totalSelected === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        {totalSelected === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            Aun no se han agregado pruebas ni paneles.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {selectedPanels.map((p) => (
              <li
                key={`panel-${p.panelId}`}
                className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2"
              >
                <div
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-700"
                  aria-hidden
                >
                  <LayoutPanelLeft className="size-3.5" />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {p.code}
                </span>
                <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                <Badge variant="outline" className="text-[10px] tabular-nums">
                  {p.testsCount} {p.testsCount === 1 ? 'prueba' : 'pruebas'}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removePanel(p.panelId)}
                  aria-label={`Quitar panel ${p.name}`}
                  title="Quitar"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))}
            {selectedTests.map((t) => (
              <li
                key={`test-${t.testId}`}
                className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3 py-2"
              >
                <div
                  className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground"
                  aria-hidden
                >
                  <FlaskConical className="size-3.5" />
                </div>
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {t.code}
                </span>
                <span className="flex-1 truncate text-sm">{t.name}</span>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeTest(t.testId)}
                  aria-label={`Quitar ${t.name}`}
                  title="Quitar"
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
