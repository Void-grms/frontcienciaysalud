import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FlaskConical,
  KeyRound,
  Loader2,
  Lock,
  User,
} from 'lucide-react';

import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { ApiError } from '@shared/api/error-mapper';
import { defaultPathForRole, useAuth } from '@shared/auth/useAuth';
import { cn } from '@shared/lib/cn';

import loginScientistImg from '@/assets/login-scientist.png';

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

interface StageMsg {
  emoji: string;
  title: string;
  body: string;
}

function greetingForHour(hour: number): { label: string; emoji: string } {
  if (hour < 6) return { label: 'Buenas noches', emoji: '🌙' };
  if (hour < 12) return { label: 'Buenos días', emoji: '☀️' };
  if (hour < 19) return { label: 'Buenas tardes', emoji: '👋' };
  return { label: 'Buenas noches', emoji: '🌙' };
}

// El mensaje idle se construye dinamicamente con el saludo segun la hora
// (Buenos dias / Buenas tardes / Buenas noches). El resto son fijos.
function buildStageMessages(greeting: { label: string; emoji: string }): Record<Stage, StageMsg> {
  return {
    idle: {
      emoji: greeting.emoji,
      title: `${greeting.label}, ¡bienvenido!`,
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

  // Mensajes dependen del saludo, por eso se reconstruyen si la hora cambia.
  const stageMessages = useMemo(() => buildStageMessages(greeting), [greeting]);
  const msg = stageMessages[stage];

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

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[1fr_minmax(420px,_520px)]">
      {/* Panel izquierdo: ilustracion del cientifico + chat bubble reactiva.
          La imagen es el hero, la bubble flota encima sobre el lado superior. */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between">
        {/* Imagen de fondo cubriendo todo el panel. */}
        <img
          src={loginScientistImg}
          alt=""
          className="absolute inset-0 size-full object-cover"
          aria-hidden
        />
        {/* Velo translucido en la parte superior para que el logo se lea claro
            y un degrade muy suave en la parte inferior para el footer. */}
        <div
          className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/40 to-transparent"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white/40 to-transparent"
          aria-hidden
        />

        {/* Logo arriba a la izquierda */}
        <div
          className="relative z-10 flex items-center gap-2.5 p-8 animate-fade-in"
          style={{ animationDelay: '50ms' }}
        >
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/90 text-primary-700 shadow-sm ring-1 ring-primary-100 backdrop-blur">
            <FlaskConical className="size-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-primary-700 drop-shadow-sm">
            Lab Clínico
          </span>
        </div>

        {/* Chat bubble flotante: posicionada arriba-cerca del cientifico
            (su cabeza esta aprox. al 45% horizontal, 35% vertical del panel).
            El bubble vive a su izquierda con el triangulito apuntando hacia
            la cabeza (derecha-abajo), simulando que el cientifico "habla". */}
        <div
          className="absolute left-[6%] top-[14%] z-10 max-w-[44%] animate-fade-in xl:top-[12%]"
          style={{ animationDelay: '200ms' }}
        >
          <MascotChatBubble stage={stage} msg={msg} variant="floating" />
        </div>

        {/* Footer */}
        <div
          className="relative z-10 mt-auto flex items-center justify-between p-8 text-xs text-primary-700/80 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <span className="rounded-md bg-white/80 px-2 py-1 shadow-sm backdrop-blur">
            © {new Date().getFullYear()} Lab Clínico — {greeting.label}
          </span>
          <span className="flex items-center gap-1.5 rounded-md bg-white/80 px-2 py-1 shadow-sm backdrop-blur">
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
  // - `floating`: encima de la imagen del cientifico (fondo opaco + sombra fuerte)
  //   con triangulito apuntando hacia abajo-derecha (donde esta su cabeza)
  // - `light`: mobile, sin imagen detras, triangulito a la izquierda como bubble clasica
  variant?: 'floating' | 'light';
}

function MascotChatBubble({ stage, msg, variant = 'floating' }: MascotProps) {
  // En la variante `floating`, el icono que indica el estado vive DENTRO del
  // bubble (esquina superior izquierda) para no romper la lectura del bubble
  // como "globo de dialogo del cientifico". En `light` (mobile) usamos avatar
  // a la izquierda para reforzar la idea de mascota.
  const StageIcon = stage === 'submitting' ? Loader2 : stage === 'success' ? CheckCircle2 : FlaskConical;

  if (variant === 'light') {
    return (
      <div className="flex max-w-sm items-start gap-3">
        <div
          className={cn(
            'grid size-11 shrink-0 place-items-center rounded-2xl shadow-md',
            'bg-primary-50 text-primary-700 ring-1 ring-primary-100',
            stage === 'success' && 'animate-mascot-pop',
            stage === 'submitting' && 'animate-pulse',
          )}
          aria-hidden
        >
          <StageIcon
            className={cn(
              'size-5',
              stage === 'submitting' && 'animate-spin',
              stage === 'success' && 'text-success',
            )}
          />
        </div>
        <div className="relative flex-1 rounded-2xl rounded-tl-sm bg-white px-4 py-3 shadow-sm ring-1 ring-border">
          <span className="absolute -left-1 top-3 size-2 rotate-45 bg-white ring-1 ring-border" aria-hidden />
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

  // Floating: globo de dialogo que "sale" del cientifico (triangulito en la
  // esquina inferior-derecha apuntando hacia donde esta su cabeza).
  return (
    <div
      className={cn(
        'relative rounded-2xl rounded-br-sm bg-white/95 px-4 py-3 shadow-lg ring-1 ring-border/60 backdrop-blur transition-all',
        stage === 'success' && 'animate-mascot-pop',
      )}
    >
      {/* Triangulito inferior-derecho, apuntando hacia abajo-derecha (hacia
          la cabeza del cientifico). */}
      <span
        className="absolute -bottom-1 right-6 size-2 rotate-45 bg-white/95"
        aria-hidden
      />
      <div key={stage} className="flex items-start gap-2.5 animate-fade-in">
        <span
          className={cn(
            'mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-primary-50 text-primary-700 ring-1 ring-primary-100',
            stage === 'submitting' && 'animate-pulse',
          )}
          aria-hidden
        >
          <StageIcon
            className={cn(
              'size-3.5',
              stage === 'submitting' && 'animate-spin',
              stage === 'success' && 'text-success',
            )}
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {msg.title} <span className="ml-0.5">{msg.emoji}</span>
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{msg.body}</p>
        </div>
      </div>
    </div>
  );
}
