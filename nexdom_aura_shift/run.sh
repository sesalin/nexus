#!/bin/sh
set -e
if [ -f /tmp/requirements.txt ]; then
  pip3 install --no-cache-dir -r /tmp/requirements.txt || true
fi
exec python3 -u /app/main.py