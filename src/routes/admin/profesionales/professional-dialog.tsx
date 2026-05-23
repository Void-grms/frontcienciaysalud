import { useEffect, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Upload, X } from 'lucide-react';
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
import { storageUrl } from '@shared/api/storage-url';
import { reportFormError } from '@shared/lib/report-error';

import {
  useCreateProfessional,
  useUpdateProfessional,
  useUpdateSignature,
} from '@features/professionals/hooks';
import type { Professional } from '@features/professionals/types';

const MAX_SIGNATURE_BYTES = 500 * 1024;
const ALLOWED_MIME = ['image/png', 'image/jpeg', 'image/jpg'];

const schema = z.object({
  fullName: z.string().min(2, 'Minimo 2 caracteres').max(180),
  professionalTitle: z.string().max(80).optional().or(z.literal('')),
  licenseNumber: z.string().max(40).optional().or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface ProfessionalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  professional: Professional | null;
}

export function ProfessionalDialog({
  open,
  onOpenChange,
  professional,
}: ProfessionalDialogProps) {
  const isEditing = professional !== null;
  const createMut = useCreateProfessional();
  const updateMut = useUpdateProfessional();
  const sigMut = useUpdateSignature();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingSignature, setPendingSignature] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', professionalTitle: '', licenseNumber: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: professional?.fullName ?? '',
        professionalTitle: professional?.professionalTitle ?? '',
        licenseNumber: professional?.licenseNumber ?? '',
      });
      setPendingSignature(null);
      // Preview inicial: la firma actual servida por el backend.
      setPreview(storageUrl(professional?.signatureStorageKey ?? null));
    }
  }, [open, professional, form]);

  // Cuando el usuario elige una imagen nueva, generamos una preview local
  // a partir del File. Liberamos el ObjectURL cuando se reemplace o se cierre.
  useEffect(() => {
    if (!pendingSignature) return;
    const url = URL.createObjectURL(pendingSignature);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingSignature]);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_SIGNATURE_BYTES) {
      toast.error('La firma excede 500 KB');
      return;
    }
    if (!ALLOWED_MIME.includes(file.type)) {
      toast.error('Formato no permitido. Usa PNG o JPG.');
      return;
    }
    setPendingSignature(file);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    const cleaned = {
      fullName: values.fullName,
      ...(values.professionalTitle ? { professionalTitle: values.professionalTitle } : {}),
      ...(values.licenseNumber ? { licenseNumber: values.licenseNumber } : {}),
    };

    try {
      if (isEditing && professional) {
        await updateMut.mutateAsync({ id: professional.id, input: cleaned });
        if (pendingSignature) {
          await sigMut.mutateAsync({ id: professional.id, file: pendingSignature });
        }
        toast.success('Profesional actualizado');
      } else {
        await createMut.mutateAsync({
          ...cleaned,
          ...(pendingSignature ? { signature: pendingSignature } : {}),
        });
        toast.success('Profesional creado');
      }
      onOpenChange(false);
    } catch (err) {
      reportFormError(err, form.setError);
    }
  });

  const submitting = createMut.isPending || updateMut.isPending || sigMut.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar profesional' : 'Nuevo profesional'}</DialogTitle>
          <DialogDescription>
            El profesional firma los informes. La imagen de firma (PNG o JPG, max 500 KB) se
            incrusta en el PDF generado.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nombre completo *</Label>
            <Input
              id="fullName"
              autoComplete="off"
              placeholder="MSc. Maria Lopez"
              {...form.register('fullName')}
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="professionalTitle">Titulo</Label>
              <Input
                id="professionalTitle"
                placeholder="Bioquimica"
                {...form.register('professionalTitle')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="licenseNumber">Colegiatura</Label>
              <Input
                id="licenseNumber"
                placeholder="CBP-12345"
                {...form.register('licenseNumber')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Firma digital</Label>
            <div className="flex items-start gap-3 rounded-md border bg-muted/30 p-3">
              <div className="flex h-24 w-40 items-center justify-center overflow-hidden rounded border bg-background">
                {preview ? (
                  <img
                    src={preview}
                    alt="Firma"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">Sin firma</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0])}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Subir imagen
                </Button>
                {pendingSignature && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setPendingSignature(null);
                      setPreview(storageUrl(professional?.signatureStorageKey ?? null));
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    <X className="h-4 w-4" /> Descartar cambio
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  PNG o JPG · maximo 500 KB. Fondo transparente recomendado.
                </p>
              </div>
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
              {submitting ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear profesional'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
