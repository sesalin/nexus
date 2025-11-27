FROM node:20-alpine

# Crear usuario no-root para seguridad
RUN addgroup -g 1000 nexdom && adduser -D -s /bin/sh nexdom -G nexdom

# Instalar dependencias
WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY . .
RUN npm run build

# Configurar permisos
RUN chown -R nexdom:nexdom /app

# Cambiar a usuario no-root
USER nexdom

# Exponer puerto
EXPOSE 8123

# Salud checks
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8123/ || exit 1

# Comando por defecto
CMD ["npm", "run", "serve"]
