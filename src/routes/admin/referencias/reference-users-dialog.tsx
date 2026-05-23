import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Copy, KeyRound, Trash2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Badge } from '@shared/components/ui/badge';
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
import { reportFormError } from '@shared/lib/report-error';

import {
  useAddReferenceUser,
  useReferenceDetail,
  useRemoveReferenceUser,
} from '@features/references/hooks';

interface ReferenceUsersDialogProps {
  referenceId: string | null;
  onOpenChange: (open: boolean) => void;
}

const schema = z.object({
  email: z.string().email('Email invalido').max(180),
  fullName: z.string().min(2, 'Minimo 2 caracteres').max(180),
  password: z
    .string()
    .min(8, 'Minimo 8 caracteres')
    .max(128)
    .optional()
    .or(z.literal('')),
});

type FormValues = z.infer<typeof schema>;

interface PendingTempPassword {
  email: string;
  password: string;
}

export function ReferenceUsersDialog({ referenceId, onOpenChange }: ReferenceUsersDialogProps) {
  const open = referenceId !== null;
  const detail = useReferenceDetail(referenceId);
  const addMut = useAddReferenceUser();
  const removeMut = useRemoveReferenceUser();

  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [lastTempPassword, setLastTempPassword] = useState<PendingTempPassword | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', fullName: '', password: '' },
  });

  useEffect(() => {
    if (open) {
      form.reset({ email: '', fullName: '', password: '' });
      setLastTempPassword(null);
    }
  }, [open, form, referenceId]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!referenceId) return;
    try {
      const result = await addMut.mutateAsync({
        referenceId,
        input: {
          email: values.email,
          fullName: values.fullName,
          ...(values.password ? { password: values.password } : {}),
        },
      });
      // El backend solo devuelve `temporaryPassword` cuando NO mandamos
      // password en el request (auto-genera una). Si la generamos nosotros,
      // no la volvemos a mostrar aqui.
      if (result.temporaryPassword) {
        setLastTempPassword({ email: result.user.email, password: result.temporaryPassword });
      } else {
        toast.success(`Usuario "${result.user.email}" creado`);
      }
      form.reset({ email: '', fullName: '', password: '' });
    } catch (err) {
      reportFormError(err, form.setError);
    }
  });

  const handleRemove = async (userId: string, email: string) => {
    if (!referenceId) return;
    try {
      await removeMut.mutateAsync({ referenceId, userId });
      toast.success(`Usuario "${email}" eliminado`);
      setPendingDelete(null);
    } catch (err) {
      reportFormError(err);
    }
  };

  const handleCopyTemp = async () => {
    if (!lastTempPassword) return;
    try {
      await navigator.clipboard.writeText(
        `Usuario: ${lastTempPassword.email}\nContrasena: ${lastTempPassword.password}`,
      );
      toast.success('Credenciales copiadas');
    } catch {
      toast.error('No se pudo copiar');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Usuarios de la referencia</DialogTitle>
          <DialogDescription>
            {detail.data ? detail.data.name : 'Cargando...'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Lista existente */}
          <section>
            <h3 className="mb-2 text-sm font-medium">Usuarios actuales</h3>
            {detail.isLoading && (
              <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
            )}
            {detail.data && detail.data.users.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Aun no hay usuarios. Agrega uno desde el formulario de abajo.
              </p>
            )}
            <ul className="space-y-1">
              {detail.data?.users.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center gap-3 rounded-md border bg-card px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium">{u.fullName}</div>
                    <div className="truncate text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  <Badge variant={u.status === 'active' ? 'success' : 'muted'}>
                    {u.status}
                  </Badge>
                  {u.mustChangePassword && (
                    <Badge variant="warning" className="hidden sm:inline-flex">
                      cambio pendiente
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      pendingDelete === u.id
                        ? void handleRemove(u.id, u.email)
                        : setPendingDelete(u.id)
                    }
                    aria-label={`Eliminar ${u.email}`}
                    title={pendingDelete === u.id ? 'Click de nuevo para confirmar' : 'Eliminar'}
                  >
                    <Trash2
                      className={
                        pendingDelete === u.id ? 'h-4 w-4 text-destructive animate-pulse' : 'h-4 w-4 text-destructive'
                      }
                    />
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          {/* Form para nuevo usuario */}
          <section className="rounded-md border bg-muted/30 p-4">
            <h3 className="mb-3 text-sm font-medium">Agregar nuevo usuario</h3>
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email *</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    autoComplete="off"
                    {...form.register('email')}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userFullName">Nombre completo *</Label>
                  <Input
                    id="userFullName"
                    autoComplete="off"
                    {...form.register('fullName')}
                  />
                  {form.formState.errors.fullName && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.fullName.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPassword">
                  Contrasena (opcional — si la dejas vacia, el sistema la genera)
                </Label>
                <Input
                  id="userPassword"
                  type="text"
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={addMut.isPending}>
                  <UserPlus className="h-4 w-4" />
                  {addMut.isPending ? 'Creando...' : 'Crear usuario'}
                </Button>
              </div>
            </form>
          </section>

          {lastTempPassword && (
            <section className="rounded-md border border-amber-500/30 bg-amber-50 p-4">
              <div className="flex items-start gap-2">
                <KeyRound className="mt-0.5 h-4 w-4 text-amber-600" />
                <div className="text-sm">
                  <p className="font-medium text-amber-700">Contrasena temporal generada</p>
                  <p className="mt-1 font-mono">
                    {lastTempPassword.email} · <span className="font-bold">{lastTempPassword.password}</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Solo se muestra una vez. El usuario debera cambiarla en su primer ingreso.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() => void handleCopyTemp()}
                >
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
              </div>
            </section>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
