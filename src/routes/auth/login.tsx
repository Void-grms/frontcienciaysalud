import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Loader2,
  Lock,
  TestTubes,
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

// Etapas que conducen el mensaje de la mascota y los estados visuales.
type Stage =
  | 'idle'
  | 'typing_email'
  | 'email_ok'
  | 'typing_password'
  | 'password_ok'
  | 'submitting'
  | 'success'
  | 'error';

const STAGE_MESSAGES: Record<Stage, { emoji: string; title: string; body: string }> = {
  idle: {
    emoji: '👋',
    title: '¡Bienvenido!',
    body: 'Ingresa tus credenciales para acceder al sistema del laboratorio.',
  },
  typing_email: {
    emoji: '✏️',
    title: 'Te escucho',
    body: 'Sigue escribiendo tu email o número de documento.',
  },
  email_ok: {
    emoji: '👏',
    title: 'Vamos bien',
    body: 'Solo falta tu contraseña para acceder al sistema.',
  },
  typing_password: {
    emoji: '🔐',
    title: 'Casi',
    body: 'Tu contraseña debe tener al menos 6 caracteres.',
  },
  password_ok: {
    emoji: '✨',
    title: 'Todo listo',
    body: 'Presiona "Entrar" para acceder al sistema.',
  },
  submitting: {
    emoji: '🧪',
    title: 'Casi listo',
    body: 'Verificamos tus credenciales para darte acceso.',
  },
  success: {
    emoji: '✅',
    title: '¡Listo!',
    body: 'Bienvenido de nuevo al sistema del laboratorio.',
  },
  error: {
    emoji: '🤔',
    title: 'Hmm…',
    body: 'No pudimos validar esas credenciales. Inténtalo otra vez.',
  },
};

function greetingForHour(hour: number): string {
  if (hour < 6) return 'Buenas noches';
  if (hour < 12) return 'Buenos dias';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function isIdentifierValid(v: string): boolean {
  if (!v) return false;
  // Email valido O documento numerico de 6+ digitos.
  return /^.+@.+\..+$/.test(v) || /^\d{6,}$/.test(v);
}

export default function LoginPage() {
  const { user, login, isAuthenticating } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? null;

  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [greeting, setGreeting] = useState(() => greetingForHour(new Date().getHours()));
  const [forcedStage, setForcedStage] = useState<Stage | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: { identifier: '', password: '' },
  });

  const identifier = form.watch('identifier');
  const password = form.watch('password');

  const identifierOk = useMemo(() => isIdentifierValid(identifier), [identifier]);
  const passwordOk = password.length >= 6;

  const inferredKind: 'email' | 'patient' | null = (() => {
    if (!identifier) return null;
    if (identifier.includes('@')) return 'email';
    if (/^\d{6,}$/.test(identifier)) return 'patient';
    return null;
  })();

  // Stage derivado: success/error/submitting tienen prioridad (los gatilla el submit).
  const stage: Stage = (() => {
    if (forcedStage) return forcedStage;
    if (form.formState.isSubmitting) return 'submitting';
    if (!identifier) return 'idle';
    if (!identifierOk) return 'typing_email';
    if (!password) return 'email_ok';
    if (!passwordOk) return 'typing_password';
    return 'password_ok';
  })();

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
      setForcedStage('success');
      toast.success(`Bienvenido${u.fullName ? `, ${u.fullName}` : ''}`);
      // Pequeño delay para que el usuario vea el mensaje "¡Listo!" antes de navegar.
      await new Promise((res) => setTimeout(res, 650));
      navigate(from ?? defaultPathForRole(u.role), { replace: true });
    } catch (err) {
      setForcedStage('error');
      // Reseteamos el stage forzado tras unos segundos para que el usuario pueda volver
      // a intentar y vea los mensajes reactivos normales.
      window.setTimeout(() => setForcedStage(null), 2500);
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

  const msg = STAGE_MESSAGES[stage];

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_minmax(420px,_520px)]">
      {/* Panel izquierdo: escena de laboratorio + mascota reactiva. Solo desktop. */}
      <div className="relative hidden overflow-hidden bg-primary-700 text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        {/* Mesh gradient animado de fondo. */}
        <div className="absolute inset-0" aria-hidden>
          <div
            className="absolute -left-1/4 -top-1/4 size-[120%] animate-mesh-spin opacity-50 blur-3xl"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%, hsl(173 90% 50% / 0.5), hsl(180 85% 40% / 0.4), hsl(165 80% 35% / 0.5), hsl(190 90% 45% / 0.4), hsl(173 90% 50% / 0.5))',
            }}
          />
        </div>
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.06] mask-radial-fade" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary-700 to-transparent" aria-hidden />

        {/* Decoraciones flotantes — frascos / ADN sutiles. */}
        <FloatingLabDecor />

        {/* Logo */}
        <div
          className="relative z-10 flex items-center gap-2.5 animate-fade-in"
          style={{ animationDelay: '50ms' }}
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/15 backdrop-blur ring-1 ring-white/20">
            <FlaskConical className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">Lab Clinico</span>
        </div>

        {/* Centro: saludo grande + mascota con chat bubble reactiva */}
        <div
          className="relative z-10 max-w-md space-y-7 animate-fade-in"
          style={{ animationDelay: '150ms' }}
        >
          <div className="space-y-3">
            <p className="text-sm font-medium text-primary-foreground/70">{greeting}.</p>
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              El laboratorio clínico,{' '}
              <span className="text-primary-foreground/80">en tus manos.</span>
            </h1>
          </div>

          {/* Mascota + chat bubble — se anima cuando cambia el stage */}
          <MascotChatBubble stage={stage} msg={msg} />
        </div>

        {/* Footer */}
        <div
          className="relative z-10 flex items-center justify-between text-xs text-primary-foreground/60 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <span>© {new Date().getFullYear()} Lab Clinico</span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-success animate-pulse" />
            Sistema operativo
          </span>
        </div>
      </div>

      {/* Panel derecho: formulario. */}
      <div className="relative flex min-h-screen flex-col justify-center bg-background px-6 py-12 sm:px-12">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] mask-radial-fade lg:hidden" aria-hidden />

        <div className="relative mx-auto w-full max-w-sm space-y-8 animate-fade-in">
          {/* Logo solo mobile */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <FlaskConical className="size-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight">Lab Clinico</span>
          </div>

          {/* Chat bubble visible en mobile (donde no hay panel izquierdo). */}
          <div className="lg:hidden">
            <MascotChatBubble stage={stage} msg={msg} variant="light" />
          </div>

          <div className="space-y-2 animate-fade-in" style={{ animationDelay: '50ms' }}>
            <h2 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h2>
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
              <Label htmlFor="identifier">Email o número de documento</Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground transition-colors peer-focus:text-primary"
                  aria-hidden
                />
                <Input
                  id="identifier"
                  autoComplete="username"
                  placeholder="ejemplo@labclinico.com"
                  className={cn(
                    'peer pl-9 pr-20 transition-colors',
                    identifierOk && 'border-success/50 focus-visible:border-success',
                  )}
                  autoFocus
                  disabled={stage === 'submitting' || stage === 'success'}
                  {...form.register('identifier')}
                  aria-invalid={!!form.formState.errors.identifier || undefined}
                />
                {/* Badge tipo (Email / Paciente) — solo cuando no se muestra el check */}
                {inferredKind && !identifierOk && (
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700"
                    aria-live="polite"
                  >
                    {inferredKind === 'patient' ? 'Paciente' : 'Email'}
                  </span>
                )}
                {identifierOk && (
                  <CheckCircle2
                    className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-success animate-fade-in"
                    aria-label="Formato válido"
                  />
                )}
              </div>
              {form.formState.errors.identifier ? (
                <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                  <AlertCircle className="size-3" />
                  {form.formState.errors.identifier.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Los pacientes ingresan con su número de documento.
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Contraseña</Label>
                <Link
                  to="/recuperar-contrasena"
                  className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline"
                  tabIndex={stage === 'submitting' ? -1 : 0}
                >
                  ¿Olvidaste tu contraseña?
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
                  placeholder="Ingresa tu contraseña"
                  className={cn(
                    'peer pl-9 pr-10 transition-colors',
                    passwordOk && 'border-success/50 focus-visible:border-success',
                  )}
                  onKeyDown={handlePasswordKey}
                  onKeyUp={handlePasswordKey}
                  disabled={stage === 'submitting' || stage === 'success'}
                  {...form.register('password')}
                  aria-invalid={!!form.formState.errors.password || undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:shadow-ring"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>

              {/* Estado dinamico debajo de la contrasena */}
              {capsLockOn && (
                <p className="flex items-center gap-1 text-xs text-warning-foreground animate-fade-in">
                  <KeyRound className="size-3" />
                  Bloq Mayús está activado.
                </p>
              )}
              {form.formState.errors.password && (
                <p className="flex items-center gap-1 text-xs text-destructive" role="alert">
                  <AlertCircle className="size-3" />
                  {form.formState.errors.password.message}
                </p>
              )}
              {!form.formState.errors.password && stage === 'submitting' && (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-in">
                  <Loader2 className="size-3 animate-spin" />
                  Verificando credenciales…
                </p>
              )}
            </div>

            <Button
              type="submit"
              size="lg"
              className={cn(
                'group w-full transition-all',
                stage === 'success' && 'bg-success hover:bg-success',
              )}
              disabled={form.formState.isSubmitting || stage === 'success'}
            >
              {stage === 'submitting' ? (
                <>
                  <Loader2 className="animate-spin" />
                  Entrando…
                </>
              ) : stage === 'success' ? (
                <>
                  <CheckCircle2 />
                  ¡Listo!
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

// -------------------------------------------------------------------
// Mascota: frasco con burbuja de chat que cambia el mensaje segun stage.
// -------------------------------------------------------------------

interface MascotProps {
  stage: Stage;
  msg: { emoji: string; title: string; body: string };
  variant?: 'dark' | 'light';
}

function MascotChatBubble({ stage, msg, variant = 'dark' }: MascotProps) {
  const isLight = variant === 'light';
  return (
    <div className="flex items-start gap-3">
      {/* Avatar mascota */}
      <div
        className={cn(
          'grid size-12 shrink-0 place-items-center rounded-2xl shadow-sm transition-transform',
          isLight
            ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-100'
            : 'bg-white/15 text-white ring-1 ring-white/20 backdrop-blur',
          stage === 'success' && 'animate-mascot-pop',
          stage === 'submitting' && 'animate-pulse',
        )}
        aria-hidden
      >
        {stage === 'submitting' ? (
          <Loader2 className="size-6 animate-spin" />
        ) : stage === 'success' ? (
          <CheckCircle2 className="size-6 text-success" />
        ) : (
          <FlaskConical className="size-6" />
        )}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          'relative max-w-xs flex-1 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm transition-all',
          isLight
            ? 'bg-white text-foreground ring-1 ring-border'
            : 'bg-white/95 text-foreground ring-1 ring-white/30 backdrop-blur',
        )}
      >
        {/* Triangulito izquierdo del bubble */}
        <span
          className={cn(
            'absolute -left-1 top-3 size-2 rotate-45',
            isLight ? 'bg-white ring-1 ring-border' : 'bg-white/95',
          )}
          aria-hidden
        />
        <div key={stage} className="space-y-0.5 animate-fade-in">
          <p className="text-sm font-semibold">
            {msg.title} <span className="ml-0.5">{msg.emoji}</span>
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">{msg.body}</p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------------
// Decoraciones flotantes: iconos de lab suaves alrededor del panel.
// -------------------------------------------------------------------
function FloatingLabDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <FlaskConical
        className="absolute left-[8%] top-[28%] size-10 text-white/10 animate-float-slow"
        style={{ animationDelay: '0s' }}
      />
      <TestTubes
        className="absolute right-[12%] top-[18%] size-12 text-white/10 animate-float-slow"
        style={{ animationDelay: '1.2s' }}
      />
      <Activity
        className="absolute right-[20%] bottom-[28%] size-9 text-white/10 animate-float-slow"
        style={{ animationDelay: '2.4s' }}
      />
      <FlaskConical
        className="absolute left-[18%] bottom-[14%] size-8 text-white/10 animate-float-slow"
        style={{ animationDelay: '3.2s' }}
      />
    </div>
  );
}
