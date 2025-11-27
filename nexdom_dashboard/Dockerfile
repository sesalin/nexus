ARG BUILD_FROM
FROM ${BUILD_FROM}

RUN apk add --no-cache nginx

WORKDIR /app

COPY dist /usr/share/nginx/html

EXPOSE 80

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]