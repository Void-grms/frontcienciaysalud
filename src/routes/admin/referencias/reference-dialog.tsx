import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { AlertCircle, Building2, Loader2, Mail, Phone } from 'lucide-react';

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
import { Textarea } from '@shared/components/ui/textarea';
import { reportFormError } from '@shared/lib/report-error';

import { useCreateReference, useUpdateReference } from '@features/references/hooks';
import type { ReferenceListItem } from '@features/references/types';

const schema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres').max(180),
  taxId: z
    .string()
    .max(20)
    .regex(/^[A-Za-z0-9-]*$/u, 'Solo letras, numeros y guiones')
    .optional()
    .or(z.literal('')),
  contactName: z.string().max(120).optional().or(z.literal('')),
  contactEmail: z
    .string()
    .max(180)
    .email('Email invalido')
    .optional()
    .or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ReferenceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference: ReferenceListItem | null;
  onCreated?: (id: string) => void;
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

export function ReferenceDialog({
  open,
  onOpenChange,
  reference,
  onCreated,
}: ReferenceDialogProps) {
  const isEditing = reference !== null;
  const createMut = useCreateReference();
  const updateMut = useUpdateReference();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      taxId: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      address: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: reference?.name ?? '',
        taxId: reference?.taxId ?? '',
        contactName: reference?.contactName ?? '',
        contactEmail: reference?.contactEmail ?? '',
        contactPhone: reference?.contactPhone ?? '',
        address: reference?.address ?? '',
        notes: reference?.notes ?? '',
      });
    }
  }, [open, reference, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload = {
      name: values.name,
      ...(values.taxId ? { taxId: values.taxId } : {}),
      ...(values.contactName ? { contactName: values.contactName } : {}),
      ...(values.contactEmail ? { contactEmail: values.contactEmail } : {}),
      ...(values.contactPhone ? { contactPhone: values.contactPhone } : {}),
      ...(values.address ? { address: values.address } : {}),
      ...(values.notes ? { notes: values.notes } : {}),
    };

    try {
      if (isEditing && reference) {
        await updateMut.mutateAsync({ id: reference.id, input: payload });
        toast.success('Referencia actualizada');
      } else {
        const created = await createMut.mutateAsync(payload);
        toast.success('Referencia creada');
        onCreated?.(created.id);
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
              <Building2 className="size-4" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Editar referencia' : 'Nueva referencia'}</DialogTitle>
              <DialogDescription>
                Entidad externa (clinica, policlinico, medico) que puede tener uno o mas usuarios
                con acceso a su portal.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-5">
          <section className="space-y-3">
            <SectionHeader>Identidad</SectionHeader>
            <div className="grid gap-3 sm:grid-cols-[2fr_1fr]">
              <div className="space-y-1.5">
                <Label htmlFor="name">Razon social *</Label>
                <Input
                  id="name"
                  autoComplete="organization"
                  placeholder="Clinica San Pablo"
                  {...form.register('name')}
                  aria-invalid={!!form.formState.errors.name || undefined}
                />
                <FieldError message={form.formState.errors.name?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="taxId">RUC / Tax ID</Label>
                <Input
                  id="taxId"
                  autoComplete="off"
                  className="font-mono tabular-nums"
                  placeholder="20123456789"
                  {...form.register('taxId')}
                  aria-invalid={!!form.formState.errors.taxId || undefined}
                />
                <FieldError message={form.formState.errors.taxId?.message} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader>Contacto principal (opcional)</SectionHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="contactName">Nombre del contacto</Label>
                <Input
                  id="contactName"
                  autoComplete="name"
                  placeholder="Dr. Juan Perez"
                  {...form.register('contactName')}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contactEmail">Email</Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="contactEmail"
                      type="email"
                      autoComplete="email"
                      className="pl-9"
                      placeholder="contacto@clinica.com"
                      {...form.register('contactEmail')}
                      aria-invalid={!!form.formState.errors.contactEmail || undefined}
                    />
                  </div>
                  <FieldError message={form.formState.errors.contactEmail?.message} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contactPhone">Telefono</Label>
                  <div className="relative">
                    <Phone
                      className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden
                    />
                    <Input
                      id="contactPhone"
                      type="tel"
                      autoComplete="tel"
                      className="pl-9 tabular-nums"
                      placeholder="+51 999 999 999"
                      {...form.register('contactPhone')}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Direccion</Label>
                <Input
                  id="address"
                  autoComplete="street-address"
                  placeholder="Av. Principal 123"
                  {...form.register('address')}
                />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <SectionHeader>Notas internas</SectionHeader>
            <div className="space-y-1.5">
              <Textarea
                id="notes"
                rows={2}
                placeholder="Convenios, tarifarios, observaciones del lab..."
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
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear referencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
