import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AlertCircle, IdCard, Loader2, Mail, Phone, UserPlus } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import { Textarea } from '@shared/components/ui/textarea';
import { reportFormError } from '@shared/lib/report-error';

import { useCreatePatient, useUpdatePatient } from '@features/patients/hooks';
import type {
  DocumentType,
  Patient,
  PatientCreateInput,
  Sex,
} from '@features/patients/types';

const DOC_TYPES: Array<{ value: DocumentType; label: string }> = [
  { value: 'DNI', label: 'DNI' },
  { value: 'CE', label: 'Carnet de Extranjeria' },
  { value: 'PAS', label: 'Pasaporte' },
];

const SEXES: Array<{ value: Sex; label: string }> = [
  { value: 'F', label: 'Femenino' },
  { value: 'M', label: 'Masculino' },
  { value: 'A', label: 'Ambiguo' },
];

const schema = z.object({
  documentType: z.enum(['DNI', 'CE', 'PAS']),
  documentNumber: z
    .string()
    .min(4, 'Minimo 4 caracteres')
    .max(20)
    .regex(/^[A-Za-z0-9-]+$/u, 'Solo letras, numeros y guiones'),
  firstName: z.string().min(1, 'Requerido').max(80),
  lastName: z.string().min(1, 'Requerido').max(80),
  birthDate: z.string().optional().or(z.literal('')),
  sex: z.enum(['M', 'F', 'A']).optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z
    .string()
    .max(180)
    .email('Email invalido')
    .optional()
    .or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface PatientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient | null;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
      <AlertCircle className="size-3" />
      {message}
    </p>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </div>
  );
}

export function PatientDialog({ open, onOpenChange, patient }: PatientDialogProps) {
  const isEditing = patient !== null;
  const createMut = useCreatePatient();
  const updateMut = useUpdatePatient();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      documentType: 'DNI',
      documentNumber: '',
      firstName: '',
      lastName: '',
      birthDate: '',
      sex: '',
      phone: '',
      email: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        documentType: patient?.documentType ?? 'DNI',
        documentNumber: patient?.documentNumber ?? '',
        firstName: patient?.firstName ?? '',
        lastName: patient?.lastName ?? '',
        birthDate: patient?.birthDate ? patient.birthDate.slice(0, 10) : '',
        sex: patient?.sex ?? '',
        phone: patient?.phone ?? '',
        email: patient?.email ?? '',
        address: patient?.address ?? '',
        notes: patient?.notes ?? '',
      });
    }
  }, [open, patient, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const base = {
      firstName: values.firstName,
      lastName: values.lastName,
      ...(values.birthDate ? { birthDate: values.birthDate } : {}),
      ...(values.sex ? { sex: values.sex as Sex } : {}),
      ...(values.phone ? { phone: values.phone } : {}),
      ...(values.email ? { email: values.email } : {}),
      ...(values.address ? { address: values.address } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };

    try {
      if (isEditing && patient) {
        await updateMut.mutateAsync({ id: patient.id, input: base });
        toast.success('Paciente actualizado');
      } else {
        const payload: PatientCreateInput = {
          ...base,
          documentType: values.documentType,
          documentNumber: values.documentNumber,
        };
        await createMut.mutateAsync(payload);
        toast.success('Paciente creado');
      }
      onOpenChange(false);
    } catch (err) {
      reportFormError(err, form.setError);
    }
  });

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div
              className="grid size-9 place-items-center rounded-md bg-primary-50 text-primary-700"
              aria-hidden
            >
              <UserPlus className="size-4" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'El tipo y numero de documento no se pueden cambiar — las ordenes historicas los referencian.'
                  : 'Registra un paciente nuevo en el sistema. Los campos con * son obligatorios.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Seccion: Identidad */}
          <section className="space-y-3">
            <SectionHeader>
              <span className="inline-flex items-center gap-1.5">
                <IdCard className="size-3" /> Identidad
              </span>
            </SectionHeader>

            <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
              <div className="space-y-1.5">
                <Label>Tipo de documento *</Label>
                <Select
                  value={form.watch('documentType')}
                  onValueChange={(v) =>
                    form.setValue('documentType', v as DocumentType, { shouldValidate: true })
                  }
                  disabled={isEditing}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DOC_TYPES.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        {d.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="documentNumber">Numero de documento *</Label>
                <Input
                  id="documentNumber"
                  autoComplete="off"
                  className="font-mono tabular-nums"
                  disabled={isEditing}
                  placeholder="12345678"
                  {...form.register('documentNumber')}
                  aria-invalid={!!form.formState.errors.documentNumber || undefined}
                />
                <FieldError message={form.formState.errors.documentNumber?.message} />
              </div>
            </div>
          </section>

          {/* Seccion: Datos personales */}
          <section className="space-y-3">
            <SectionHeader>Datos personales</SectionHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Nombres *</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  {...form.register('firstName')}
                  aria-invalid={!!form.formState.errors.firstName || undefined}
                />
                <FieldError message={form.formState.errors.firstName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Apellidos *</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  {...form.register('lastName')}
                  aria-invalid={!!form.formState.errors.lastName || undefined}
                />
                <FieldError message={form.formState.errors.lastName?.message} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="birthDate">Fecha de nacimiento</Label>
                <Input id="birthDate" type="date" {...form.register('birthDate')} />
                <p className="text-[11px] text-muted-foreground">
                  Necesaria para que los rangos por edad apliquen.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Sexo</Label>
                <Select
                  value={form.watch('sex') || undefined}
                  onValueChange={(v) => form.setValue('sex', v as Sex, { shouldValidate: true })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona" />
                  </SelectTrigger>
                  <SelectContent>
                    {SEXES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Necesario para los rangos por sexo.
                </p>
              </div>
            </div>
          </section>

          {/* Seccion: Contacto */}
          <section className="space-y-3">
            <SectionHeader>Contacto (opcional)</SectionHeader>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefono</Label>
                <div className="relative">
                  <Phone
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    className="pl-9 tabular-nums"
                    placeholder="+51 999 999 999"
                    {...form.register('phone')}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden
                  />
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className="pl-9"
                    placeholder="paciente@correo.com"
                    {...form.register('email')}
                    aria-invalid={!!form.formState.errors.email || undefined}
                  />
                </div>
                <FieldError message={form.formState.errors.email?.message} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Direccion</Label>
              <Input
                id="address"
                autoComplete="street-address"
                placeholder="Av. Principal 123, distrito"
                {...form.register('address')}
              />
            </div>
          </section>

          {/* Seccion: Notas */}
          <section className="space-y-3">
            <SectionHeader>Notas internas</SectionHeader>

            <div className="space-y-1.5">
              <Textarea
                id="notes"
                rows={2}
                placeholder="Observaciones, alergias, condiciones especiales..."
                {...form.register('notes')}
              />
              <p className="text-[11px] text-muted-foreground">
                Solo visibles para el personal del laboratorio.
              </p>
            </div>
          </section>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="animate-spin" />}
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
