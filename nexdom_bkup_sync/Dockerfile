ARG BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest
FROM ${BUILD_FROM}

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SUPERVISOR_URL=http://supervisor \
    ADDON_PORT=8099

RUN apk add --no-cache \
    python3 \
    py3-pip \
    curl \
    tzdata \
    bash \
    jq

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r /app/requirements.txt

COPY run.sh /app/run.sh
COPY backup.py scheduler.py remote_policy.py supervisor_api.py policy_merge.py /app/
COPY utils/ /app/utils/
COPY storage/ /app/storage/

EXPOSE 8099

CMD ["/app/run.sh"]