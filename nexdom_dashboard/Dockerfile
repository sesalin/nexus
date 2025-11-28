# Multi-stage build para Nexdom OS add-on
# Stage 1: Build React frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy project files needed for build (include index.html explicitly)
COPY package*.json index.html vite.config.ts tailwind.config.js postcss.config.js tsconfig*.json ./
COPY src/ ./src/
COPY public/ ./public/

# Install all dependencies for build (including dev deps like Vite)
RUN npm ci && npm run build

# Stage 2: Setup backend dependencies
FROM node:20-alpine AS backend-builder

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Stage 3: Final runtime image
FROM nginx:alpine

# Install Node.js for backend
RUN apk add --no-cache nodejs npm curl

# Create app directory
WORKDIR /app

# Copy backend
COPY --from=backend-builder /app/backend /app/backend
COPY backend/src/server.js /app/backend/src/

# Copy built frontend to nginx directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration with proxy
COPY nginx/nginx.conf /etc/nginx/nginx.conf

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --only=production

# Create scripts directory
RUN mkdir -p /app/scripts

# Copy startup script
COPY ha-addon/run.sh /app/scripts/start.sh
RUN chmod +x /app/scripts/start.sh

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8123/health || exit 1

# Expose port
EXPOSE 8123

# Start script
CMD ["/app/scripts/start.sh"]