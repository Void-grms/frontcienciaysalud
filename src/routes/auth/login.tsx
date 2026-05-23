import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  FileSignature,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Stethoscope,
  User,
} from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { ApiError } from '@shared/api/error-mapper';
import { defaultPathForRole, useAuth } from '@shared/auth/useAuth';
import { cn } from '@shared/lib/cn';

const schema = z.object({
  identifier: z.string().min(3, 'Ingresa tu email o documento').max(180),
  password: z.string().min(6, 'Minimo 6 caracteres').max(128),
});

type FormValues = z.infer<typeof schema>;

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Informes con firma digital',
    body: 'Cada PDF lleva un QR de verificacion publica — cualquier institucion puede confirmar autenticidad sin login.',
  },
  {
    icon: Activity,
    title: 'Banderas automaticas',
    body: 'Los valores fuera de rango se marcan como alto, bajo o critico segun la edad y sexo del paciente.',
  },
  {
    icon: FileSignature,
    title: 'Auditoria completa',
    body: 'Cada login, edicion y entrega queda registrada — listo para inspecciones sanitarias.',
  },
  {
    icon: Stethoscope,
    title: 'Acceso diferenciado',
    body: 'Portales separados para admin, pacientes y clinicas de referencia. Cada uno solo ve lo que le corresponde.',
  },
];

function greetingForHour(hour: number): string {
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buenos dias';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function LoginPage() {
  const { user, login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? null;

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [featureIdx, setFeatureIdx] = useState(0);
  const [greeting, setGreeting] = useState(() => greetingForHour(new Date().getHours()));

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '', password: '' },
  });

  const identifier = form.watch('identifier');
  const inferredKind = (() => {
    if (!identifier) return null;
    if (identifier.includes('@')) return 'admin-or-reference';
    if (/^\d{6,}$/.test(identifier)) return 'patient';
    return null;
  })();

  // Rotacion del carrusel cada 6s. Solo si no esta isAuthenticating para
  // evitar timers huerfanos. Pausa por hover via CSS data-pause si necesario.
  useEffect(() => {
    const id = window.setInterval(() => {
      setFeatureIdx((i) => (i + 1) % FEATURES.length);
    }, 6000);
    return () => window.clearInterval(id);
  }, []);

  // Refresca el saludo si el usuario abre la pestana en otro horario.
  useEffect(() => {
    const id = window.setInterval(() => {
      setGreeting(greetingForHour(new Date().getHours()));
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

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

  const handlePasswordKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLockOn(e.getModifierState('CapsLock'));
  };

  const currentFeature = FEATURES[featureIdx]!;
  const FeatureIcon = currentFeature.icon;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_minmax(420px,_520px)]">
      {/* Panel izquierdo: branding + carrusel. Solo desktop. */}
      <div className="relative hidden overflow-hidden bg-primary-700 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Mesh gradient animado de fondo. Conic-gradient + blur + animacion lenta
            para que no distraiga pero de sensacion de movimiento. */}
        <div className="absolute inset-0" aria-hidden>
          <div className="absolute -left-1/4 -top-1/4 size-[120%] animate-mesh-spin opacity-50 blur-3xl"
               style={{
                 background:
                   'conic-gradient(from 0deg at 50% 50%, hsl(173 90% 50% / 0.5), hsl(180 85% 40% / 0.4), hsl(165 80% 35% / 0.5), hsl(190 90% 45% / 0.4), hsl(173 90% 50% / 0.5))',
               }}
          />
        </div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] mask-radial-fade" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary-700 to-transparent" aria-hidden />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur ring-1 ring-white/20">
            <Activity className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Lab Clinico</span>
        </div>

        {/* Mensaje principal */}
        <div className="relative z-10 max-w-md space-y-6 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary-foreground/70">{greeting}.</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              El sistema clinico que tu equipo necesita,{' '}
              <span className="text-primary-foreground/80">cada dia.</span>
            </h1>
            <p className="text-base text-primary-foreground/80">
              Pacientes, ordenes, resultados y entrega de informes firmados — todo en un solo
              sistema, con auditoria completa de cada accion.
            </p>
          </div>

          {/* Carrusel de features con fade entre items */}
          <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-md bg-white/10 ring-1 ring-white/15">
                <FeatureIcon className="size-4.5" />
              </div>
              <div key={featureIdx} className="min-w-0 flex-1 animate-fade-in">
                <h3 className="text-sm font-semibold">{currentFeature.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-primary-foreground/75">
                  {currentFeature.body}
                </p>
              </div>
            </div>
            {/* Dots */}
            <div className="mt-5 flex items-center gap-1.5">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setFeatureIdx(i)}
                  aria-label={`Ver caracteristica ${i + 1} de ${FEATURES.length}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === featureIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/30 hover:bg-white/50',
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-primary-foreground/60 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <span>© {new Date().getFullYear()} Lab Clinico</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Sistema operativo
          </span>
        </div>
      </div>

      {/* Panel derecho: formulario. */}
      <div className="relative flex min-h-screen flex-col justify-center bg-background px-6 py-12 sm:px-12">
        {/* Sutil pattern en mobile cuando no hay panel izquierdo */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] mask-radial-fade lg:hidden" aria-hidden />

        <div className="relative mx-auto w-full max-w-sm space-y-8 animate-fade-in">
          {/* Logo solo mobile */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Activity className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Lab Clinico</span>
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesion</h2>
            <p className="text-sm text-muted-foreground">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>

          <form
            className="space-y-5 animate-fade-in"
            style={{ animationDelay: '100ms' }}
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
          >
            {/* Identifier */}
            <div className="space-y-1.5">
              <Label htmlFor="identifier">Email o numero de documento</Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-primary"
                  aria-hidden
                />
                <Input
                  id="identifier"
                  autoComplete="username"
                  placeholder="admin@laboratorio.com"
                  className="peer pl-9"
                  autoFocus
                  {...form.register('identifier')}
                  aria-invalid={!!form.formState.errors.identifier || undefined}
                />
                {inferredKind && (
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700"
                    aria-live="polite"
                  >
                    {inferredKind === 'patient' ? 'Paciente' : 'Email'}
                  </span>
                )}
              </div>
              {form.formState.errors.identifier ? (
                <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                  <AlertCircle className="size-3" />
                  {form.formState.errors.identifier.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Los pacientes ingresan con su numero de documento.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contrasena</Label>
                <Link
                  to="/recuperar-contrasena"
                  className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline"
                >
                  Olvide mi contrasena
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-primary"
                  aria-hidden
                />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="peer pl-9 pr-10"
                  onKeyDown={handlePasswordKey}
                  onKeyUp={handlePasswordKey}
                  {...form.register('password')}
                  aria-invalid={!!form.formState.errors.password || undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-ring"
                  aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Caps lock warning */}
              {capsLockOn && (
                <p className="flex items-center gap-1 text-xs text-warning-foreground animate-fade-in">
                  <KeyRound className="size-3" />
                  Bloq Mayus esta activado.
                </p>
              )}
              {form.formState.errors.password && (
                <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                  <AlertCircle className="size-3" />
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className="group w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Entrar
                  <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </form>

          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              ¿Eres usuario nuevo?
              <div className="h-px flex-1 bg-border" />
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Contacta al administrador del laboratorio para que te genere credenciales de acceso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
