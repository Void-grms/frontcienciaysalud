import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Activity, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { ApiError } from '@shared/api/error-mapper';
import { defaultPathForRole, useAuth } from '@shared/auth/useAuth';

const schema = z.object({
  identifier: z.string().min(3, 'Ingresa tu email o documento').max(180),
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
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_minmax(420px,_520px)]">
      {/* Panel izquierdo: branding + value props. Solo en pantallas grandes. */}
      <div className="relative hidden overflow-hidden bg-primary-700 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-10 mask-radial-fade" aria-hidden />

        <div className="relative z-10 flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur">
            <Activity className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Lab Clinico</span>
        </div>

        <div className="relative z-10 max-w-md space-y-5">
          <h1 className="text-3xl font-semibold leading-tight tracking-tight">
            Gestiona tu laboratorio con seguridad y trazabilidad clinica.
          </h1>
          <p className="text-base text-primary-foreground/85">
            Pacientes, ordenes, resultados y entrega de informes firmados —
            todo en un solo sistema, con auditoria completa de cada accion.
          </p>

          <ul className="space-y-3 pt-4 text-sm text-primary-foreground/90">
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 flex-none" />
              <span>Informes con firma digital y verificacion por QR publico.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 flex-none" />
              <span>Banderas automaticas para valores criticos y rangos de referencia por edad/sexo.</span>
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 flex-none" />
              <span>Acceso diferenciado para admin, pacientes y clinicas de referencia.</span>
            </li>
          </ul>
        </div>

        <div className="relative z-10 text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} Lab Clinico. Todos los derechos reservados.
        </div>
      </div>

      {/* Panel derecho: formulario. */}
      <div className="flex min-h-screen flex-col justify-center bg-background px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm space-y-8 animate-fade-in">
          {/* Logo compacto solo visible en mobile. */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Lab Clinico</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesion</h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>

          <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Email o numero de documento</Label>
              <Input
                id="identifier"
                autoComplete="username"
                placeholder="admin@laboratorio.com"
                {...form.register('identifier')}
                aria-invalid={!!form.formState.errors.identifier || undefined}
              />
              {form.formState.errors.identifier && (
                <p className="text-xs text-destructive">{form.formState.errors.identifier.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Los pacientes ingresan con su numero de documento.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contrasena</Label>
                <Link
                  to="/recuperar-contrasena"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Olvide mi contrasena
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register('password')}
                aria-invalid={!!form.formState.errors.password || undefined}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              Entrar
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            ¿Problemas para acceder? Contacta al administrador del laboratorio.
          </p>
        </div>
      </div>
    </div>
  );
}
