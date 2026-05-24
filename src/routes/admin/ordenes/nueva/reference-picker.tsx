import { useState } from 'react';
import { Building2, Loader2, Search, X } from 'lucide-react';

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
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
        <div
          className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-700"
          aria-hidden
        >
          <Building2 className="size-4" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <div className="truncate font-medium">{selected.name}</div>
          {selected.taxId && (
            <div className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
              RUC {selected.taxId}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onSelect(null)}
          aria-label="Quitar referencia"
          title="Quitar referencia"
        >
          <X />
        </Button>
      </div>
    );
  }

  const items = query.data?.items ?? [];
  const showList = !!debouncedSearch || items.length > 0;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar clinica o medico referente (opcional)..."
          className="pl-9"
          aria-label="Buscar referencia"
        />
        {query.isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      {showList && (
        <ul className="max-h-60 overflow-y-auto rounded-lg border border-border bg-card">
          {query.isLoading && (
            <li className="px-3 py-3 text-sm text-muted-foreground">Cargando...</li>
          )}
          {!query.isLoading && items.length === 0 && (
            <li className="px-3 py-4 text-center text-sm text-muted-foreground">
              Sin coincidencias.
            </li>
          )}
          {items.map((r) => (
            <li key={r.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
              >
                <div
                  className="grid size-8 shrink-0 place-items-center rounded-md bg-primary-50 text-primary-700"
                  aria-hidden
                >
                  <Building2 className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{r.name}</div>
                  {r.taxId && (
                    <div className="truncate font-mono text-[11px] text-muted-foreground tabular-nums">
                      RUC {r.taxId}
                    </div>
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
