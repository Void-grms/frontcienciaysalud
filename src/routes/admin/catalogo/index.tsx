import { useSearchParams } from 'react-router-dom';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';

import { CategoriesTab } from './categories-tab';
import { ImportTab } from './import-tab';
import { PanelsTab } from './panels-tab';
import { TestsTab } from './tests-tab';

type TabKey = 'categorias' | 'pruebas' | 'paneles' | 'importacion';
const TABS: TabKey[] = ['categorias', 'pruebas', 'paneles', 'importacion'];

function isTabKey(value: string | null): value is TabKey {
  return value !== null && (TABS as string[]).includes(value);
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const current: TabKey = isTabKey(searchParams.get('tab')) ? (searchParams.get('tab') as TabKey) : 'categorias';

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Catalogo</h1>
        <p className="text-sm text-muted-foreground">
          Administra las categorias, pruebas, paneles e importacion masiva del catalogo del laboratorio.
        </p>
      </div>

      <Tabs value={current} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="pruebas">Pruebas</TabsTrigger>
          <TabsTrigger value="paneles">Paneles</TabsTrigger>
          <TabsTrigger value="importacion">Importacion</TabsTrigger>
        </TabsList>
        <TabsContent value="categorias">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="pruebas">
          <TestsTab />
        </TabsContent>
        <TabsContent value="paneles">
          <PanelsTab />
        </TabsContent>
        <TabsContent value="importacion">
          <ImportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
