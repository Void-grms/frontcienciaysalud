import { useState } from 'react';
import { KeyRound, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <p className="text-sm text-muted-foreground">
          Registro maestro de pacientes. Desde aqui se puede crear el acceso al portal del paciente
          (login con DNI + contrasena temporal).
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Lista de pacientes</CardTitle>
            <CardDescription>
              {query.data ? `${query.data.total} pacientes registrados` : 'Cargando...'}
            </CardDescription>
          </div>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Nuevo paciente
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Buscar por nombre, apellido o documento..."
                className="pl-8"
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Documento</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Email / Telefono</TableHead>
                  <TableHead className="w-[80px] text-right">Edad</TableHead>
                  <TableHead className="w-[140px] text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {query.isLoading ? (
                  <TableEmpty colSpan={5}>Cargando...</TableEmpty>
                ) : query.isError ? (
                  <TableEmpty colSpan={5}>No se pudieron cargar los pacientes.</TableEmpty>
                ) : query.data?.items.length === 0 ? (
                  <TableEmpty colSpan={5}>No hay pacientes para los filtros actuales.</TableEmpty>
                ) : (
                  query.data?.items.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {p.documentType}
                          </Badge>
                          <span className="font-mono text-xs">{p.documentNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {p.lastName}, {p.firstName}
                        </div>
                        {p.sex && (
                          <span className="text-xs text-muted-foreground">
                            {p.sex === 'M' ? 'Masculino' : p.sex === 'F' ? 'Femenino' : 'Ambiguo'}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        <div className="space-y-0.5 text-xs">
                          {p.email && <div>{p.email}</div>}
                          {p.phone && <div>{p.phone}</div>}
                          {!p.email && !p.phone && <span>—</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {calcAge(p.birthDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingPortal(p)}
                            aria-label={`Resetear acceso al portal de ${p.firstName}`}
                            title="Crear o resetear acceso al portal"
                          >
                            <KeyRound className="h-4 w-4 text-amber-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(p)}
                            aria-label={`Editar ${p.firstName}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(p)}
                            aria-label={`Eliminar ${p.firstName}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
