import { useState } from 'react';
import { Eye, Search, ShieldCheck } from 'lucide-react';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Log de auditoria</h1>
        <p className="text-sm text-muted-foreground">
          Traza inmutable de las acciones criticas: cambios de estado de ordenes, captura de
          resultados, soft-deletes y modificaciones de configuracion.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  resetPage();
                }}
                placeholder="Action exacta (ej. order.delivered)"
                className="pl-8 font-mono"
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
            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Desde</Label>
                <Input
                  type="date"
                  value={from}
                  onChange={(e) => {
                    setFrom(e.target.value);
                    resetPage();
                  }}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-xs text-muted-foreground">Hasta</Label>
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Eventos</CardTitle>
          <CardDescription>
            {query.data ? `${query.data.total} eventos registrados` : 'Cargando...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Fecha</TableHead>
                  <TableHead className="w-[180px]">Action</TableHead>
                  <TableHead className="hidden md:table-cell w-[120px]">Entidad</TableHead>
                  <TableHead>Resumen</TableHead>
                  <TableHead className="hidden lg:table-cell w-[100px]">Rol</TableHead>
                  <TableHead className="w-[60px] text-right">Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={6}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={6}>No se pudo cargar la auditoria.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={6}>No hay eventos para los filtros actuales.</TableEmpty>
                ) : (
                  query.data?.items.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {formatDateTime(e.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionVariant(e.action)} className="font-mono">
                          {e.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs">
                        {e.entityType}
                      </TableCell>
                      <TableCell className="max-w-[420px] truncate text-sm">
                        {e.summary ?? '—'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                        {e.actorRole ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelected(e)}
                          aria-label="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {query.data && (
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
