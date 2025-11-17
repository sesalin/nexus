#!/usr/bin/env bash
set -euo pipefail
export PYTHONPATH=/app
uvicorn backup:app --host 0.0.0.0 --port ${ADDON_PORT:-8099}