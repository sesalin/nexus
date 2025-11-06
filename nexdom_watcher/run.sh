#!/usr/bin/env sh
set -e

export OPTIONS_PATH="${OPTIONS_PATH:-/data/options.json}"

exec python -m app.main
