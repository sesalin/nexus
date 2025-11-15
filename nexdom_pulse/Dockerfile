ARG BUILD_FROM
FROM $BUILD_FROM

RUN apk add --no-cache python3 py3-pip
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
WORKDIR /app
COPY requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir -r /app/requirements.txt
COPY app /app
COPY run.sh /run.sh
RUN chmod +x /run.sh
ENV PYTHONUNBUFFERED=1
CMD ["/run.sh"]
