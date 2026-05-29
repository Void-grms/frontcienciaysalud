import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogBody,
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

import { useCreatePanel, useUpdatePanel } from '@features/catalog/hooks';
import type { PanelListItem } from '@features/catalog/types';

const schema = z.object({
  code: z.string().min(2, 'Minimo 2 caracteres').max(40),
  name: z.string().min(2, 'Minimo 2 caracteres').max(180),
  description: z.string().max(1000).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface PanelCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  panel: PanelListItem | null;
  // Cuando el padre quiere ofrecer "abrir gestion de pruebas" justo despues
  // de crear un panel nuevo, pasa este callback con el id del panel creado.
  onCreated?: (panelId: string) => void;
}

export function PanelCreateDialog({
  open,
  onOpenChange,
  panel,
  onCreated,
}: PanelCreateDialogProps) {
  const isEditing = panel !== null;
  const createMut = useCreatePanel();
  const updateMut = useUpdatePanel();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: '', name: '', description: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        code: panel?.code ?? '',
        name: panel?.name ?? '',
        description: panel?.description ?? '',
      });
    }
  }, [open, panel, form]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (isEditing && panel) {
        await updateMut.mutateAsync({
          id: panel.id,
          input: {
            name: values.name,
            ...(values.description ? { description: values.description } : { description: '' }),
          },
        });
        toast.success('Panel actualizado');
      } else {
        const created = await createMut.mutateAsync({
          code: values.code,
          name: values.name,
          ...(values.description ? { description: values.description } : {}),
        });
        toast.success('Panel creado');
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar panel' : 'Nuevo panel'}</DialogTitle>
          <DialogDescription>
            Los paneles agrupan pruebas que suelen pedirse juntas (ej. perfil hepatico, hemograma).
            {!isEditing && ' Tras crearlo te abrimos el gestor para agregarle pruebas.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-1 min-h-0 flex-col">
          <DialogBody className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="code">Codigo *</Label>
              <Input
                id="code"
                autoComplete="off"
                disabled={isEditing}
                placeholder="HEM-COMP"
                {...form.register('code')}
              />
              {form.formState.errors.code && (
                <p className="text-xs text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
            <div className="space-y-2 col-span-2 sm:col-span-1">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                autoComplete="off"
                placeholder="Hemograma completo"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea id="description" rows={3} {...form.register('description')} />
          </div>

          </DialogBody>
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
              {submitting
                ? 'Guardando...'
                : isEditing
                  ? 'Guardar cambios'
                  : 'Crear y gestionar pruebas'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
