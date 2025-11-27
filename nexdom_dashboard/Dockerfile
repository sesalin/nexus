ARG BUILD_FROM

# Build stage: instala dependencias y genera el bundle
FROM ${BUILD_FROM} AS build
RUN apk add --no-cache nodejs npm

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: sólo nginx y los archivos estáticos generados
FROM ${BUILD_FROM}
RUN apk add --no-cache nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist /usr/share/nginx/html

WORKDIR /app
COPY run.sh /run.sh
RUN chmod +x /run.sh

EXPOSE 80

CMD ["/run.sh"]
