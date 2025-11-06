from __future__ import annotations

from datetime import datetime, timezone


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def topic_safe(value: str) -> str:
    """Convierte un identificador en formato seguro para MQTT."""
    return value.replace(" ", "_").replace("/", "_")
