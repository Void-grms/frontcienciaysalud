import { useState } from 'react';
import { Search, UserCheck, X } from 'lucide-react';

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
      <div className="flex items-center gap-3 rounded-md border bg-emerald-50 px-3 py-2">
        <UserCheck className="h-5 w-5 text-emerald-600" />
        <div className="flex-1 min-w-0">
          <div className="font-medium">
            {selected.lastName}, {selected.firstName}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="font-mono">
              {selected.documentType}
            </Badge>
            <span className="font-mono">{selected.documentNumber}</span>
            {selected.email && <span>· {selected.email}</span>}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
          aria-label="Cambiar paciente"
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
          placeholder="Busca por nombre, apellido o documento..."
          className="pl-8"
          autoFocus
        />
      </div>
      <ul className="max-h-72 space-y-1 overflow-y-auto rounded-md border bg-background">
        {query.isLoading && (
          <li className="px-3 py-2 text-sm text-muted-foreground">Cargando...</li>
        )}
        {!query.isLoading && query.data?.items.length === 0 && (
          <li className="px-3 py-2 text-sm text-muted-foreground">
            {debouncedSearch
              ? 'No se encontraron pacientes con esa busqueda.'
              : 'Empieza a escribir para buscar pacientes.'}
          </li>
        )}
        {query.data?.items.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onSelect(p)}
              className="flex w-full items-center gap-3 border-b px-3 py-2 text-left text-sm last:border-b-0 hover:bg-accent"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {p.lastName}, {p.firstName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.documentType} {p.documentNumber}
                  {p.email && <> · {p.email}</>}
                </div>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
