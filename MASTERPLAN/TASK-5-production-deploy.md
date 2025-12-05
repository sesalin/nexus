# TASK 5: Production Build + Deploy

**Agent**: AI-5  
**Priority**: 🔴 CRITICAL  
**Duration**: 4-6 horas  
**Dependencies**: TASK 2, 3, 4 complete

---

## ⚠️ CRITICAL - DO NOT

**NEVER** read, search, or edit files in:
- ❌ `node_modules/` - Third-party packages (waste of time)
- ❌ `dist/` or `build/` - Build artifacts
- ❌ `.vite/` or `.cache/` - Cache directories
- ❌ `.git/` - Version control

**ONLY** work in:
- ✅ `PWA/src/` - Source code (for fixes)
- ✅ `PWA/public/` - Static assets
- ✅ Root files (`Dockerfile`, `package.json`, build configs)
- ✅ `PWA/dist/` - Only for analyzing build output size

---

## 🎯 Objetivo

Build production-ready Docker image, deploy a production, configurar monitoreo, y estar listo para usuarios reales.

---

## 📋 Checklist

### Build
- [ ] Production build sin errores
- [ ] TypeScript strict mode passing
- [ ] Bundle size optimizado (\u003c 2MB)
- [ ] Tree-shaking funcionando
- [ ] Source maps generados

### Docker
- [ ] Dockerfile optimizado (multi-stage)
- [ ] Image size \u003c 100MB
- [ ] Health check configurado
- [ ] Environment variables configuradas

### Deploy
- [ ] Deploy a tu HAOS
- [ ] DNS apuntando (cheko.nexdom.mx)
- [ ] HTTPS funcionando
- [ ] CORS configurado

### Monitoring
- [ ] Error tracking (Sentry optional)
- [ ] Logs accesibles
- [ ] Uptime monitoring

---

## 🏗️ Production Build

### 1. Build React App

```bash
cd /home/cheko/nexdom/addon/PWA
npm run build
```

**Verificar**:
- `dist/` folder creado
- `dist/index.html` existe
- `dist/assets/` contiene JS/CSS chunks
- No errors en console

**Optimización**:
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'hakit': ['@hakit/core', '@hakit/components'],
          'ui': ['framer-motion', 'lucide-react'],
        }
      }
    }
  }
});
```

**Check bundle size**:
```bash
ls -lh dist/assets/
# Main JS should be \u003c 500KB gzipped
```

---

## 🐳 Docker Image

### Dockerfile

**Archivo**: `PWA/Dockerfile`

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY . .

# Build
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --quiet --tries=1 --spider http://localhost:80/health || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf

**Archivo**: `PWA/nginx.conf`

```nginx
events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  gzip on;
  gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

  server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # API proxy to Home Assistant
    location /api/ {
      proxy_pass http://homeassistant.local:8123/api/;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_http_version 1.1;
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection "upgrade";
    }

    # SPA fallback
    location / {
      try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
      access_log off;
      return 200 "OK\n";
      add_header Content-Type text/plain;
    }
  }
}
```

### Build Image

```bash
cd /home/cheko/nexdom/addon/PWA
docker build -t nexdom-dashboard:latest .

# Verify
docker images | grep nexdom
# Should show image \u003c 100MB
```

### Test Locally

```bash
docker run -p 8080:80 --name nexdom-test nexdom-dashboard:latest

# Open http://localhost:8080
# Verify app loads
```

---

## 🚀 Deploy to Production

**Según tu setup**. Asumiendo tienes HAOS con add-on capability.

### Option A: Direct Docker on HAOS host

```bash
# SSH to HAOS host
ssh root@your-haos-server

# Pull/load image
docker pull nexdom-dashboard:latest  # or load from tar

# Run
docker run -d \
  --name nexdom-dashboard \
  --restart=unless-stopped \
  -p 8123:80 \
  -e HA_URL=http://localhost:8123 \
  nexdom-dashboard:latest

# Verify
docker ps | grep nexdom
docker logs nexdom-dashboard
```

### Option B: HA Add-on

**Archivo**: `addon/config.yaml`

```yaml
name: "Nexdom Dashboard"
version: "1.0.0"
slug: "nexdom_dashboard"
description: "Smart Home Dashboard with @hakit/core"
arch:
  - amd64
  - aarch64
  - armv7
startup: application
boot: auto
ingress: true
ingress_port: 80
homeassistant_api: true
panel_icon: mdi:home-automation
```

**Build add-on**:
```bash
# En el directorio del add-on
docker build -t local/nexdom-dashboard .

# Reload add-ons en HAOS UI
# Install "Nexdom Dashboard"
```

---

## 🌐 DNS & HTTPS

### DNS Setup

**Assumiendo tienes**:
- Dominio: `cheko.nexdom.mx`
- HAOS IP: `192.168.X.X` o IP pública

**Cloudflare** (o tu DNS provider):
```
Type: A
Name: cheko
Content: YOUR_PUBLIC_IP
Proxy: ✓ (Orange cloud)
TTL: Auto
```

### HTTPS (Caddy o Nginx Reverse Proxy)

**Si usas Caddy**:
```caddy
cheko.nexdom.mx {
  reverse_proxy localhost:8123
}
```

**Auto SSL**: Caddy genera certs automáticamente.

**Verificar**:
```bash
curl https://cheko.nexdom.mx
# Should return HTML
```

---

## 📊 Monitoring

### 1. Error Tracking (Sentry - opcional)

```typescript
// main.tsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "YOUR_SENTRY_DSN",
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay(),
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
  });
}
```

### 2. Logs

```bash
# Docker logs
docker logs -f nexdom-dashboard

# Nginx access logs
docker exec nexdom-dashboard tail -f /var/log/nginx/access.log
```

### 3. Uptime Monitor

**UptimeRobot** (free):
- Monitor: https://cheko.nexdom.mx
- Check every: 5 minutes
- Alert: Email/Telegram si down

---

## ✅ Production Readiness Checklist

### Pre-Deploy
- [ ] All TASKs 1-4 complete
- [ ] No console errors
- [ ] TypeScript strict passing
- [ ] Build succeeds
- [ ] Docker image builds
- [ ] Health check passes

### Deploy
- [ ] Image deployed to server
- [ ] Container running
- [ ] DNS resolves
- [ ] HTTPS works
- [ ] App loads in browser
- [ ] Login works (OAuth2)
- [ ] HAOS connection established

### Post-Deploy
- [ ] Test en mobile real
- [ ] Test en desktop
- [ ] Verify all features work
- [ ] Error tracking active
- [ ] Logs accessible
- [ ] Backup strategy defined

---

## 🚨 Rollback Plan

### If Critical Bug in Production

**Paso 1**: Stop new container
```bash
docker stop nexdom-dashboard
```

**Paso 2**: Deploy previous version
```bash
docker run -d \
  --name nexdom-dashboard-rollback \
  -p 8123:80 \
  nexdom-dashboard:previous-version
```

**Paso 3**: Investigate issue
```bash
docker logs nexdom-dashboard
# Check error logs
# Fix in dev
```

**Time to rollback**: \u003c 5 minutos

---

## 📦 Deliverables

- ✅ Production build (`dist/` folder)
- ✅ Docker image (\u003c 100MB)
- ✅ Deployed to production
- ✅ HTTPS working
- ✅ Monitoring configured
- ✅ Rollback plan tested
- ✅ Screenshot of live app
- ✅ Lighthouse production score

---

## 🎉 Success Criteria

### Technical
- ✅ App accessible at https://cheko.nexdom.mx
- ✅ Lighthouse score \u003e 90
- ✅ No console errors
- ✅ HAOS connected
- ✅ All features work

### User Experience
- ✅ Login works
- ✅ Devices controllable
- ✅ Real-time updates
- ✅ Mobile responsive
- ✅ Install prompt works

---

**SHIP IT! 🚢**
