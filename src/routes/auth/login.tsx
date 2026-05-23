import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { ApiError } from '@shared/api/error-mapper';
import { defaultPathForRole, useAuth } from '@shared/auth/useAuth';

const schema = z.object({
  identifier: z
    .string()
    .min(3, 'Ingresa tu email o documento')
    .max(180),
  password: z.string().min(6, 'Minimo 6 caracteres').max(128),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { user, login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? null;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  // Si ya hay sesion al llegar al login, redirige al portal correspondiente.
  if (!isAuthenticating && user) {
    return <Navigate to={from ?? defaultPathForRole(user.role)} replace />;
  }

  const onSubmit = async (values: FormValues) => {
    try {
      const u = await login(values.identifier, values.password);
      toast.success(`Bienvenido${u.fullName ? `, ${u.fullName}` : ''}`);
      navigate(from ?? defaultPathForRole(u.role), { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.title, { description: err.detail });
        if (err.status === 401) {
          form.setError('password', { message: 'Credenciales invalidas' });
        }
      } else {
        toast.error('No se pudo iniciar sesion');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Iniciar sesion</CardTitle>
          <CardDescription>
            Ingresa tu correo (admin/referencia) o documento (paciente) y contrasena.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-2">
              <Label htmlFor="identifier">Email o documento</Label>
              <Input
                id="identifier"
                autoComplete="username"
                placeholder="admin@laboratorio.com"
                {...form.register('identifier')}
                aria-invalid={!!form.formState.errors.identifier || undefined}
              />
              {form.formState.errors.identifier && (
                <p className="text-sm text-destructive">{form.formState.errors.identifier.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contrasena</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
                aria-invalid={!!form.formState.errors.password || undefined}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Entrar
            </Button>

            <div className="text-center text-sm">
              <Link to="/recuperar-contrasena" className="text-primary hover:underline">
                Olvide mi contrasena
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
