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

import { useCreateCategory, useUpdateCategory } from '@features/catalog/hooks';
import type { Category, CategoryInput } from '@features/catalog/types';

const HEX_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const schema = z.object({
  name: z.string().min(2, 'Minimo 2 caracteres').max(120),
  description: z.string().max(1000).optional().or(z.literal('')),
  color: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || HEX_RE.test(v), 'Color hex invalido (ej. #0F766E)'),
  displayOrder: z.coerce.number().int().min(0).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
}

export function CategoryDialog({ open, onOpenChange, category }: CategoryDialogProps) {
  const isEditing = category !== null;
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '', color: '', displayOrder: 0 },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: category?.name ?? '',
        description: category?.description ?? '',
        color: category?.color ?? '',
        displayOrder: category?.displayOrder ?? 0,
      });
    }
  }, [open, category, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    const payload: CategoryInput = {
      name: values.name,
      ...(values.description ? { description: values.description } : {}),
      ...(values.color ? { color: values.color } : {}),
      ...(values.displayOrder !== undefined ? { displayOrder: values.displayOrder } : {}),
    };

    try {
      if (isEditing && category) {
        await updateMut.mutateAsync({ id: category.id, input: payload });
        toast.success('Categoria actualizada');
      } else {
        await createMut.mutateAsync(payload);
        toast.success('Categoria creada');
      }
      onOpenChange(false);
    } catch (err) {
      reportFormError(err, form.setError);
    }
  });

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar categoria' : 'Nueva categoria'}</DialogTitle>
          <DialogDescription>
            Las categorias agrupan pruebas dentro del informe y permiten reutilizar el profesional firmante.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" autoComplete="off" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="color">Color (hex)</Label>
              <Input
                id="color"
                placeholder="#0F766E"
                autoComplete="off"
                {...form.register('color')}
              />
              {form.formState.errors.color && (
                <p className="text-xs text-destructive">{form.formState.errors.color.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Orden</Label>
              <Input
                id="displayOrder"
                type="number"
                min={0}
                {...form.register('displayOrder')}
              />
              {form.formState.errors.displayOrder && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.displayOrder.message}
                </p>
              )}
            </div>
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
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
