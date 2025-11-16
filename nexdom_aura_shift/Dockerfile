ARG BUILD_FROM
FROM ${BUILD_FROM}

ENV LANG=C.UTF-8 \
    PYTHONUNBUFFERED=1

RUN apk add --no-cache python3 py3-pip

WORKDIR /app

COPY requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

COPY run.sh /usr/local/bin/run.sh
COPY app /app

RUN chmod +x /usr/local/bin/run.sh

CMD ["/usr/local/bin/run.sh"]
