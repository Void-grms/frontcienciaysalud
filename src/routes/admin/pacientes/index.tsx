import { useState } from 'react';
import { KeyRound, Pencil, Plus, Search, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@shared/components/ui/alert-dialog';
import { Pager } from '@shared/components/pager';
import { useDebouncedValue } from '@shared/lib/use-debounced-value';
import { reportFormError } from '@shared/lib/report-error';

import {
  useDeletePatient,
  useGrantPortalAccess,
  usePatientsList,
} from '@features/patients/hooks';
import type {
  DocumentType,
  Patient,
  PortalAccessResponse,
} from '@features/patients/types';

import { PatientDialog } from './patient-dialog';
import { PortalAccessDialog } from './portal-access-dialog';

const DOC_FILTERS: Array<{ value: 'all' | DocumentType; label: string }> = [
  { value: 'all', label: 'Todos los docs' },
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carnet de Extranjeria' },
  { value: 'PAS', label: 'Pasaporte' },
];

function calcAge(birthDate: string | null): string {
  if (!birthDate) return '—';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return '—';
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} a`;
}

function patientInitials(p: Patient): string {
  const f = p.firstName?.[0] ?? '';
  const l = p.lastName?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

function sexLabel(sex: string | null | undefined): string {
  if (sex === 'M') return 'Masculino';
  if (sex === 'F') return 'Femenino';
  return 'Sin especificar';
}

export default function PacientesPage() {
  const [search, setSearch] = useState('');
  const [documentType, setDocumentType] = useState<'all' | DocumentType>('all');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Patient | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Patient | null>(null);
  const [pendingPortal, setPendingPortal] = useState<Patient | null>(null);
  const [portalResult, setPortalResult] = useState<PortalAccessResponse | null>(null);

  const params = {
    page,
    perPage: 25,
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
    ...(documentType !== 'all' ? { documentType } : {}),
  };

  const query = usePatientsList(params);
  const deleteMut = useDeletePatient();
  const portalMut = useGrantPortalAccess();

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (p: Patient) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteMut.mutateAsync(pendingDelete.id);
      toast.success(`Paciente "${pendingDelete.firstName} ${pendingDelete.lastName}" eliminado`);
      setPendingDelete(null);
    } catch (err) {
      reportFormError(err);
    }
  };

  const confirmPortal = async () => {
    if (!pendingPortal) return;
    try {
      const result = await portalMut.mutateAsync(pendingPortal.id);
      setPortalResult(result);
      setPendingPortal(null);
    } catch (err) {
      reportFormError(err);
    }
  };

  const total = query.data?.total ?? 0;
  const hasFilters = debouncedSearch !== '' || documentType !== 'all';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pacientes"
        description="Registro maestro de pacientes. Desde aqui se genera el acceso al portal del paciente (login con DNI + contrasena temporal)."
        meta={
          query.data && (
            <Badge variant="subtle">
              {total} {total === 1 ? 'paciente registrado' : 'pacientes registrados'}
            </Badge>
          )
        }
        actions={
          <Button onClick={openCreate}>
            <Plus /> Nuevo paciente
          </Button>
        }
      />

      <Card>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, apellido o documento..."
                className="pl-9"
                aria-label="Buscar pacientes"
              />
            </div>
            <Select
              value={documentType}
              onValueChange={(v) => {
                setDocumentType(v as 'all' | DocumentType);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_FILTERS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Documento</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead className="hidden md:table-cell">Contacto</TableHead>
                  <TableHead className="w-[80px] text-right">Edad</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={5} iconHidden>
                    Cargando pacientes...
                  </TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={5}>No se pudieron cargar los pacientes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={5} icon={Users}>
                    {hasFilters
                      ? 'No hay pacientes para los filtros aplicados.'
                      : 'Aun no hay pacientes registrados. Crea el primero con "Nuevo paciente".'}
                  </TableEmpty>
                ) : (
                  query.data?.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {p.documentType}
                          </Badge>
                          <span className="font-mono text-xs tabular-nums">
                            {p.documentNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-50 text-[11px] font-semibold text-primary-700"
                            aria-hidden
                          >
                            {patientInitials(p)}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {p.lastName}, {p.firstName}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {sexLabel(p.sex)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-0.5 text-xs leading-tight text-muted-foreground">
                          {p.email && <div className="truncate">{p.email}</div>}
                          {p.phone && <div className="tabular-nums">{p.phone}</div>}
                          {!p.email && !p.phone && (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                        {calcAge(p.birthDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPendingPortal(p)}
                            aria-label={`Resetear acceso al portal de ${p.firstName}`}
                            title="Crear o resetear acceso al portal"
                          >
                            <KeyRound className="text-warning-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(p)}
                            aria-label={`Editar ${p.firstName}`}
                            title="Editar paciente"
                          >
                            <Pencil />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setPendingDelete(p)}
                            aria-label={`Eliminar ${p.firstName}`}
                            title="Eliminar paciente"
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </div>
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

      <PatientDialog open={dialogOpen} onOpenChange={setDialogOpen} patient={editing} />

      <PortalAccessDialog data={portalResult} onClose={() => setPortalResult(null)} />

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar paciente</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a eliminar a &quot;{pendingDelete?.firstName} {pendingDelete?.lastName}&quot;. Las
              ordenes ya emitidas se mantienen; el paciente se marca como eliminado y deja de
              aparecer en busquedas para nuevas ordenes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingPortal !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPortal(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Acceso al portal del paciente</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingPortal && pendingPortal.users && pendingPortal.users.length > 0
                ? `El paciente ya tiene acceso. Al continuar se genera una nueva contrasena temporal y se invalida la anterior.`
                : 'Se va a crear un usuario con login = numero de documento y una contrasena temporal que se mostrara una sola vez.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={portalMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void confirmPortal();
              }}
              disabled={portalMut.isPending}
            >
              {portalMut.isPending ? 'Procesando...' : 'Generar credenciales'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
