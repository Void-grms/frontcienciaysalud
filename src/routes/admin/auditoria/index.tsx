import { useState } from 'react';
import { Eye, FileSearch, Search } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { PageHeader } from '@shared/components/page-header';
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
import { Pager } from '@shared/components/pager';
import { formatDateTime } from '@shared/lib/format-date';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';

import { useAuditList } from '@features/audit/hooks';
import type { AuditEntry } from '@features/audit/types';

import { AuditDetailDialog } from './audit-detail-dialog';

// Lista controlada de tipos de entidad — espejo de los emit() en el backend.
// La mantenemos local para evitar un endpoint extra para alimentar el filtro.
const ENTITY_TYPES = [
  { value: 'all', label: 'Todas las entidades' },
  { value: 'order', label: 'Ordenes' },
  { value: 'patient', label: 'Pacientes' },
  { value: 'reference', label: 'Referencias' },
  { value: 'professional', label: 'Profesionales' },
  { value: 'order_item', label: 'Items de orden' },
  { value: 'lab_config', label: 'Configuracion' },
];

// Helpers de presentacion para el chip de "action": agrupamos por familia y
// le damos un color para que el operador escanee la tabla rapido.
function actionVariant(action: string): 'success' | 'warning' | 'destructive' | 'muted' | 'outline' {
  if (action.endsWith('.created') || action.endsWith('.delivered')) return 'success';
  if (action.endsWith('.validated')) return 'success';
  if (action.includes('cancel') || action.includes('soft_deleted') || action.includes('removed'))
    return 'destructive';
  if (action.includes('amend') || action.includes('warning')) return 'warning';
  if (action.includes('updated') || action.includes('saved')) return 'outline';
  return 'muted';
}

export default function AuditoriaPage() {
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<string>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const debouncedAction = useDebouncedValue(search, 300);

  // El backend acepta `action` exacta. Para busqueda flexible, el usuario
  // tendria que tipear el action completo (ej. "order.delivered"). En una
  // iteracion futura podriamos agregar un filtro `actionPrefix` en el backend.
  const params = {
    page,
    perPage: 50,
    ...(debouncedAction ? { action: debouncedAction } : {}),
    ...(entityType !== 'all' ? { entityType } : {}),
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
  };
  const query = useAuditList(params);

  const resetPage = () => setPage(1);

  const total = query.data?.total ?? 0;
  const hasFilters = !!debouncedAction || entityType !== 'all' || !!from || !!to;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Traza inmutable de las acciones criticas del sistema: cambios de estado de ordenes, captura de resultados, soft-deletes y modificaciones de configuracion."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'evento' : 'eventos'} registrados
            </Badge>
          )
        }
      />

      <Card>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_140px_140px]">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                placeholder="Action exacta (ej. order.delivered)"
                className="pl-9 font-mono"
                aria-label="Buscar por action"
              />
            </div>
            <Select
              value={entityType}
              onValueChange={(v) => {
                setEntityType(v);
                resetPage();
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ENTITY_TYPES.map((e) => (
                  <SelectItem key={e.value} value={e.value}>
                    {e.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Desde</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => {
                  setFrom(e.target.value);
                  resetPage();
                }}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => {
                  setTo(e.target.value);
                  resetPage();
                }}
              />
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Fecha</TableHead>
                  <TableHead className="w-[200px]">Action</TableHead>
                  <TableHead className="hidden w-[120px] md:table-cell">Entidad</TableHead>
                  <TableHead>Resumen</TableHead>
                  <TableHead className="hidden w-[110px] lg:table-cell">Rol</TableHead>
                  <TableHead className="w-[48px] text-right" aria-label="Detalle" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6} iconHidden>
                    Cargando eventos...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudo cargar la auditoria.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6} icon={FileSearch}>
                    {hasFilters
                      ? 'No hay eventos para los filtros aplicados.'
                      : 'Aun no se registran eventos. Cuando los usuarios trabajen en el sistema apareceran aqui.'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((e) => (
                    <TableRow key={e.id} className="group">
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(e.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionVariant(e.action)} className="font-mono">
                          {e.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground md:table-cell">
                        {e.entityType}
                      </TableCell>
                      <TableCell className="max-w-[420px] truncate text-sm">
                        {e.summary ?? '—'}
                      </TableCell>
                      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                        {e.actorRole ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setSelected(e)}
                          aria-label="Ver detalle"
                          title="Ver detalle"
                          className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        >
                          <Eye />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {query.data && query.data.items.length > 0 && (
            <Pager
              page={query.data.page}
              perPage={query.data.perPage}
              total={query.data.total}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>

      <AuditDetailDialog entry={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
