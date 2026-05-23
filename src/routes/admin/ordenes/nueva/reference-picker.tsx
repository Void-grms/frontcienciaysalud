import { useState } from 'react';
import { Search, X } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { useReferencesList } from '@features/references/hooks';
import type { ReferenceListItem } from '@features/references/types';

interface ReferencePickerProps {
  selected: ReferenceListItem | null;
  onSelect: (reference: ReferenceListItem | null) => void;
}

export function ReferencePicker({ selected, onSelect }: ReferencePickerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const query = useReferencesList({
    page: 1,
    perPage: 10,
    status: 'active',
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  if (selected) {
    return (
      <div className="flex items-center gap-3 rounded-md border px-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium">{selected.name}</div>
          {selected.taxId && (
            <div className="text-xs text-muted-foreground">RUC {selected.taxId}</div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
          aria-label="Quitar referencia"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar referencia (opcional)..."
          className="pl-8"
        />
      </div>
      {(debouncedSearch || query.data?.items.length) && (
        <ul className="max-h-60 space-y-1 overflow-y-auto rounded-md border bg-background">
          {query.isLoading && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Cargando...</li>
          )}
          {!query.isLoading && query.data?.items.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">Sin coincidencias.</li>
          )}
          {query.data?.items.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="flex w-full items-center gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{r.name}</div>
                  {r.taxId && (
                    <div className="text-xs text-muted-foreground">RUC {r.taxId}</div>
                  )}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
