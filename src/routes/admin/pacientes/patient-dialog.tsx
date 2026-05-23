import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

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
    // Limpiamos campos vacios: el backend rechaza email='' con un error de
    // validacion (no es opcional vs string vacio), asi que enviamos undefined.
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar paciente' : 'Nuevo paciente'}</DialogTitle>
          <DialogDescription>
            El tipo y numero de documento no se modifican una vez creado el paciente: las ordenes
            historicas lo referencian.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
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
            <div className="space-y-2 col-span-2 sm:col-span-2">
              <Label htmlFor="documentNumber">Numero de documento *</Label>
              <Input
                id="documentNumber"
                autoComplete="off"
                disabled={isEditing}
                {...form.register('documentNumber')}
              />
              {form.formState.errors.documentNumber && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.documentNumber.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombres *</Label>
              <Input id="firstName" autoComplete="off" {...form.register('firstName')} />
              {form.formState.errors.firstName && (
                <p className="text-xs text-destructive">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellidos *</Label>
              <Input id="lastName" autoComplete="off" {...form.register('lastName')} />
              {form.formState.errors.lastName && (
                <p className="text-xs text-destructive">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="birthDate">Fecha de nacimiento</Label>
              <Input id="birthDate" type="date" {...form.register('birthDate')} />
            </div>
            <div className="space-y-2">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" autoComplete="tel" {...form.register('phone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...form.register('email')} />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Input id="address" autoComplete="street-address" {...form.register('address')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea id="notes" rows={2} {...form.register('notes')} />
          </div>

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
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear paciente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
