# ===============================
# Stage 1: Build React frontend
# ===============================
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json index.html vite.config.ts tailwind.config.js postcss.config.js tsconfig*.json ./
COPY src/ ./src/
COPY public/ ./public/

RUN npm ci && npm run build


# ===============================
# Stage 2: Build backend deps (prod only)
# ===============================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci --omit=dev

# copy backend source here so queda completo en el stage
COPY backend/src ./src


# ===============================
# Stage 3: Final runtime image
# ===============================
FROM nginx:alpine

# Node runtime para backend
RUN apk add --no-cache nodejs npm curl

WORKDIR /app

# Copia backend con node_modules ya listos
COPY --from=backend-builder /app/backend /app/backend

# Copia frontend estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Script de arranque
RUN mkdir -p /app/scripts
COPY ha-addon/run.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh

# Defaults prod + límite RAM (puedes subir a 384 si quieres)
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=256"

# Healthcheck directo al backend (más confiable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 8123
CMD ["/app/scripts/start.sh"]
