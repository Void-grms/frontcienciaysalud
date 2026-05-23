import { useSearchParams } from 'react-router-dom';

import { PageHeader } from '@shared/components/page-header';
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
  const current: TabKey = isTabKey(searchParams.get('tab'))
    ? (searchParams.get('tab') as TabKey)
    : 'categorias';

  const setTab = (tab: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogo"
        description="Administra las categorias, pruebas y paneles del laboratorio. La pestana 'Importacion' permite cargar el catalogo masivo desde Excel."
      />

      <Tabs value={current} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="categorias">Categorias</TabsTrigger>
          <TabsTrigger value="pruebas">Pruebas</TabsTrigger>
          <TabsTrigger value="paneles">Paneles</TabsTrigger>
          <TabsTrigger value="importacion">Importacion</TabsTrigger>
        </TabsList>
        <TabsContent value="categorias" className="mt-0">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="pruebas" className="mt-0">
          <TestsTab />
        </TabsContent>
        <TabsContent value="paneles" className="mt-0">
          <PanelsTab />
        </TabsContent>
        <TabsContent value="importacion" className="mt-0">
          <ImportTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
