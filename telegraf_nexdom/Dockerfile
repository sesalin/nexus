FROM telegraf:1.30-alpine

RUN apk add --no-cache bash jq gettext

COPY run.sh /run.sh
COPY telegraf.conf /etc/telegraf/telegraf.conf
RUN chmod +x /run.sh

USER root

CMD ["/run.sh"]
