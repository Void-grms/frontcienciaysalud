import { useState } from 'react';
import { Check, Loader2, Search, X } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { usePatientsList } from '@features/patients/hooks';
import type { Patient } from '@features/patients/types';

interface PatientPickerProps {
  selected: Patient | null;
  onSelect: (patient: Patient | null) => void;
}

function patientInitials(p: Patient): string {
  return ((p.firstName?.[0] ?? '') + (p.lastName?.[0] ?? '')).toUpperCase() || '?';
}

export function PatientPicker({ selected, onSelect }: PatientPickerProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const query = usePatientsList({
    page: 1,
    perPage: 10,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  if (selected) {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-success/30 bg-success/5 p-3">
        <div
          className="grid size-10 shrink-0 place-items-center rounded-full bg-success/15 text-sm font-semibold text-success ring-1 ring-success/20"
          aria-hidden
        >
          {patientInitials(selected)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-medium">
              {selected.firstName} {selected.lastName}
            </span>
            <Check className="size-3.5 text-success" />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono text-[10px]">
              {selected.documentType}
            </Badge>
            <span className="font-mono tabular-nums">{selected.documentNumber}</span>
            {selected.email && (
              <>
                <span className="text-border">·</span>
                <span className="truncate">{selected.email}</span>
              </>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onSelect(null)}
          aria-label="Cambiar paciente"
          title="Cambiar paciente"
        >
          <X />
        </Button>
      </div>
    );
  }

  const items = query.data?.items ?? [];

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
          placeholder="Busca por nombre, apellido o documento..."
          className="pl-9"
          autoFocus
          aria-label="Buscar paciente"
        />
        {query.isFetching && (
          <Loader2
            className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
            aria-hidden
          />
        )}
      </div>

      {(items.length > 0 || debouncedSearch) && (
        <ul className="max-h-72 overflow-y-auto rounded-lg border border-border bg-card">
          {query.isLoading && (
            <li className="px-3 py-3 text-sm text-muted-foreground">Cargando pacientes...</li>
          )}
          {!query.isLoading && items.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              No se encontraron pacientes con esa busqueda.
            </li>
          )}
          {items.map((p) => (
            <li key={p.id} className="border-b border-border last:border-b-0">
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
              >
                <div
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-[10px] font-semibold text-primary-700"
                  aria-hidden
                >
                  {patientInitials(p)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">
                    {p.firstName} {p.lastName}
                  </div>
                  <div className="truncate text-[11px] text-muted-foreground">
                    <span className="font-mono">
                      {p.documentType} {p.documentNumber}
                    </span>
                    {p.email && (
                      <>
                        <span className="mx-1.5 text-border">·</span>
                        {p.email}
                      </>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {!debouncedSearch && items.length === 0 && (
        <p className="text-[11px] text-muted-foreground">
          Empieza a escribir para buscar pacientes.
        </p>
      )}
    </div>
  );
}
