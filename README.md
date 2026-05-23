# lab-frontend

Frontend del sistema de laboratorio clínico — **Sprints 0–9 completos**.

Stack: React 18 · Vite 5 · TypeScript 5 (estricto) · TailwindCSS 3 · Radix UI · React Router 6 · TanStack Query 5 · Axios · React Hook Form + Zod · Sonner.

---

## Requisitos

- **Node.js 20**
- **pnpm 9** (`corepack enable && corepack prepare pnpm@9 --activate`)
- Backend [`lab-backend`](../lab-backend) corriendo en `http://localhost:3000`

## Arranque rápido (desarrollo)

```powershell
$env:NODE_OPTIONS="--use-system-ca"
pnpm install

# Copiar variables (apuntan al backend en localhost:3000 por defecto)
Copy-Item .env.example .env

# Arrancar dev server con HMR
pnpm dev
```

Abrir <http://localhost:5173> y autenticarse con el admin sembrado del backend (`admin@laboratorio.com` / `Admin123!`).

## Rutas principales

| URL | Rol | Descripción |
|---|---|---|
| `/login` | público | Login con email/DNI + password |
| `/verificar/:token` | público | Verificación pública de informe (QR del PDF) |
| `/admin` | admin | Dashboard con KPIs, timeline, top tests |
| `/admin/catalogo?tab=...` | admin | Categorías, pruebas, paneles, importación XLSX |
| `/admin/pacientes` | admin | CRUD + portal access |
| `/admin/referencias` | admin | CRUD + usuarios anidados |
| `/admin/profesionales` | admin | CRUD + upload de firma |
| `/admin/ordenes` | admin | Lista + filtros + nueva orden + detalle + captura |
| `/admin/ordenes/:codigo/resultados` | admin | Captura con autosave 10 s + validar |
| `/admin/auditoria` | admin | Tabla de eventos con filtros |
| `/admin/configuracion` | admin | Datos del laboratorio + logo + HTML PDF |
| `/paciente` | patient | Mis exámenes + descarga PDF |
| `/referencia` | reference_user | Órdenes derivadas + pacientes |

## Comandos útiles

| Comando | Qué hace |
|---|---|
| `pnpm dev` | Vite con HMR (puerto 5173) |
| `pnpm build` | `tsc --noEmit && vite build` → bundle en `dist/` |
| `pnpm preview` | Sirve el bundle compilado |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint con auto-fix |

## Variables de entorno

Todas las variables del cliente empiezan con `VITE_` y se **inlinean en el bundle al hacer build** (no son runtime). Cambiar una variable requiere rebuild.

| Variable | Default | Para qué |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api/v1` | URL base de la API |
| `VITE_PUBLIC_VERIFY_URL` | `http://localhost:5173/verificar` | Base de la URL del QR del PDF |
| `VITE_APP_NAME` | `Lab Clinico` | Branding visible |
| `VITE_DEFAULT_TIMEZONE` | `America/Lima` | Zona para formateo de fechas |

## Estructura

```
lab-frontend/
├── src/
│   ├── app/                     ← App.tsx, router.tsx, main.tsx (QueryClient + Toaster)
│   ├── features/                ← Slices por dominio: types/api/hooks
│   │   ├── auth/
│   │   ├── audit/               ← Sprint 8: log de auditoria
│   │   ├── catalog/             ← categorias, pruebas, paneles, import
│   │   ├── dashboards/          ← Sprint 8: KPIs + timeline
│   │   ├── lab-config/
│   │   ├── orders/
│   │   ├── patients/
│   │   ├── portal/              ← /me/* (paciente y referencia)
│   │   ├── professionals/
│   │   ├── references/
│   │   ├── reports/             ← PDF + verificacion publica
│   │   └── results/             ← captura con autosave
│   ├── layouts/                 ← AdminLayout, PatientLayout, ReferenceLayout, PublicLayout
│   ├── routes/                  ← paginas por URL
│   │   ├── admin/
│   │   │   ├── auditoria/       ← tabla + dialog de detalle (metadata JSON)
│   │   │   ├── catalogo/
│   │   │   ├── configuracion/
│   │   │   ├── ordenes/
│   │   │   ├── pacientes/
│   │   │   ├── profesionales/
│   │   │   ├── referencias/
│   │   │   └── index.tsx        ← dashboard con SVG charts
│   │   ├── auth/login.tsx
│   │   ├── paciente/
│   │   ├── public/
│   │   └── referencia/
│   ├── shared/
│   │   ├── api/                 ← client.ts (axios + refresh), error-mapper, storage-url
│   │   ├── auth/                ← AuthProvider, RoleRoute, useAuth, types
│   │   ├── components/
│   │   │   ├── charts/          ← daily-bars, state-distribution (SVG puro)
│   │   │   ├── pager.tsx
│   │   │   └── ui/              ← primitivas Radix-based (button, dialog, table, ...)
│   │   └── lib/                 ← cn, format-date, report-error, use-debounced-value, download-blob
│   ├── styles/
│   └── vite-env.d.ts            ← tipos de import.meta.env
├── Dockerfile                   ← multi-stage build + nginx alpine
├── nginx.conf                   ← SPA fallback, gzip, security headers, /healthz
├── railway.json
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

## Despliegue

### Opción A — Railway / Vercel / Netlify

Build settings:

- Build command: `pnpm build`
- Output dir: `dist/`
- Node version: 20

Configurar las variables `VITE_*` en el dashboard de la plataforma **antes** de buildear (Vite las captura al ejecutar `pnpm build`, no en runtime).

### Opción B — Docker / VPS

```bash
# Build con URLs reales (las inline al bundle)
docker build \
  --build-arg VITE_API_URL=https://api.midominio.com/api/v1 \
  --build-arg VITE_PUBLIC_VERIFY_URL=https://midominio.com/verificar \
  --build-arg VITE_APP_NAME="Lab Clinico" \
  -t lab-frontend:latest .

# Correr
docker run -d --name lab-web -p 8080:80 lab-frontend:latest

# Verificar
curl -sf http://localhost:8080/healthz   # -> "ok"
```

### Opción C — Stack completo (postgres + api + web)

Hay un `docker-compose.prod.yml` en la **raíz del repo** (un nivel arriba de este directorio) que arma los tres servicios. Ver `../docker-compose.prod.yml` y `../.env.prod.example`.

```bash
cd ..
cp .env.prod.example .env.prod
# Editar .env.prod con los valores reales

docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
docker compose -f docker-compose.prod.yml logs -f web
```

En producción real recomendamos un reverse proxy con TLS (Caddy / Traefik / nginx host) delante:
- `midominio.com` → `web:80`
- `api.midominio.com` → `api:3000`

## Hardening de seguridad (lo que ya viene activado)

- **Access token en memoria** (nunca en `localStorage`/`sessionStorage`) → mitiga XSS persistente.
- **Refresh token en cookie HttpOnly + SameSite Lax** → no accesible desde JS.
- **Single-flight refresh** en el interceptor de Axios → múltiples 401 paralelos comparten una sola request de refresh.
- **`beforeunload` guard** en la captura de resultados → avisa si hay cambios pendientes sin guardar.
- **CSP estricta** servida por el backend (helmet). El frontend respeta las restricciones.
- **Security headers** en nginx: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`.
- **Cache largo** sólo en `/assets/*` (versionados por hash). El `index.html` es `no-store` para que despliegues no se queden cacheados.

## Troubleshooting

**Login funciona pero al recargar la página el usuario vuelve a quedar logueado/sin loguear inconsistentemente**
→ Verifica que la cookie `refreshToken` se vea en DevTools → Application → Cookies. Si no aparece, revisa CORS del backend (`FRONT_URL` y `credentials: true`).

**Build de producción tira `VITE_API_URL no definida`**
→ Vite captura `VITE_*` en build-time. Tienes que setearlas como env vars en el entorno donde corre `pnpm build` (Railway dashboard / CI / `--build-arg` en Docker).

**Después de un deploy los usuarios siguen viendo la versión vieja**
→ El `index.html` se sirve con `no-store`, así que un hard reload debería tomar la nueva versión. Si persisten, revisa que tu CDN/reverse proxy no esté forzando cache encima de los headers de nginx.

**El PDF del paciente abre pero está vacío / no carga**
→ Verifica que el backend tenga `CHROMIUM_PATH` configurado y que el contenedor tenga Chrome instalado. El frontend solo descarga el blob; la generación es 100% backend.

## Licencia

UNLICENSED — uso interno.
