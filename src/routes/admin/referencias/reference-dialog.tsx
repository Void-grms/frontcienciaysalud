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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar referencia' : 'Nueva referencia'}</DialogTitle>
          <DialogDescription>
            Una referencia agrupa una entidad externa (clinica, policlinico, medico independiente)
            que puede tener uno o mas usuarios con acceso al portal de referencias.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="name">Razon social *</Label>
              <Input id="name" autoComplete="off" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="taxId">RUC / Tax ID</Label>
              <Input id="taxId" autoComplete="off" {...form.register('taxId')} />
              {form.formState.errors.taxId && (
                <p className="text-xs text-destructive">{form.formState.errors.taxId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="contactName">Contacto</Label>
              <Input id="contactName" {...form.register('contactName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Email contacto</Label>
              <Input
                id="contactEmail"
                type="email"
                autoComplete="email"
                {...form.register('contactEmail')}
              />
              {form.formState.errors.contactEmail && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.contactEmail.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telefono contacto</Label>
              <Input id="contactPhone" autoComplete="tel" {...form.register('contactPhone')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Direccion</Label>
            <Input id="address" {...form.register('address')} />
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
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear referencia'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
