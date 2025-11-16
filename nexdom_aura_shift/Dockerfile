ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8 \
    PYTHONUNBUFFERED=1 \
    PIP_BREAK_SYSTEM_PACKAGES=1

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

RUN mkdir -p /etc/services.d/nexdom_aura_shift
COPY run.sh /etc/services.d/nexdom_aura_shift/run
COPY app /app

RUN chmod +x /etc/services.d/nexdom_aura_shift/run

CMD ["/init"]
