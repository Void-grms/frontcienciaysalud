# syntax=docker/dockerfile:1.6

# -------- Etapa 1: build --------
FROM node:20-alpine AS build
RUN corepack enable
WORKDIR /app

# Vite captura `import.meta.env.VITE_*` en build-time y los inlinea al bundle,
# asi que la URL de la API tiene que estar disponible aqui (no en runtime).
# Pasalos con --build-arg en `docker build` o desde el bloque `build.args` del
# compose. Defaults sirven para dev local; en produccion son obligatorios.
ARG VITE_API_URL=http://localhost:3000/api/v1
ARG VITE_PUBLIC_VERIFY_URL=http://localhost:5173/verificar
ARG VITE_APP_NAME="Lab Clinico"
ARG VITE_DEFAULT_TIMEZONE=America/Lima

ENV VITE_API_URL=$VITE_API_URL \
    VITE_PUBLIC_VERIFY_URL=$VITE_PUBLIC_VERIFY_URL \
    VITE_APP_NAME=$VITE_APP_NAME \
    VITE_DEFAULT_TIMEZONE=$VITE_DEFAULT_TIMEZONE

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile || pnpm install
COPY . .
RUN pnpm build

# -------- Etapa 2: runner (nginx) --------
FROM nginx:1.27-alpine AS runner

# wget para el HEALTHCHECK; ya viene en alpine pero lo declaramos explicito.
RUN apk add --no-cache wget

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
