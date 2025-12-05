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
# Stage 2: Final runtime image (nginx + static assets)
# ===============================
FROM nginx:alpine

WORKDIR /app

# Curl para healthcheck
RUN apk add --no-cache curl

# Copia frontend estático
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Script de arranque
RUN mkdir -p /app/scripts
COPY ha-addon/run.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh

# Healthcheck a nginx/static
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8123/ || exit 1

EXPOSE 8123
CMD ["/app/scripts/start.sh"]
