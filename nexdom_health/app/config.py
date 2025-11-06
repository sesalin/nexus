from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Literal


@dataclass(frozen=True)
class Thresholds:
    device_warn: int
    device_error: int
    storage_warn_free: int
    storage_error_free: int


@dataclass(frozen=True)
class Config:
    client_id: str
    ha_token: str
    webhook_url: str
    webhook_token: str
    interval_seconds: int
    log_level: Literal["debug", "info", "warning", "error"]
    thresholds: Thresholds

    @classmethod
    def load(cls, path: Path) -> "Config":
        if not path.exists():
            raise FileNotFoundError(f"No se encontró {path}")

        data = json.loads(path.read_text(encoding="utf-8"))

        required = ["client_id", "ha_token", "webhook_url"]
        for key in required:
            if not data.get(key):
                raise ValueError(f"Falta ajustar '{key}' en la configuración del add-on")

        interval = max(60, int(data.get("interval_seconds", 300)))

        thresholds = Thresholds(
            device_warn=max(0, int(data.get("device_warn_threshold", 1))),
            device_error=max(0, int(data.get("device_error_threshold", 10))),
            storage_warn_free=max(0, int(data.get("storage_warn_free_percent", 20))),
            storage_error_free=max(0, int(data.get("storage_error_free_percent", 10))),
        )

        return cls(
            client_id=str(data["client_id"]),
            ha_token=str(data["ha_token"]),
            webhook_url=str(data["webhook_url"]),
            webhook_token=str(data.get("webhook_token", "")),
            interval_seconds=interval,
            log_level=str(data.get("log_level", "info")).lower(),  # type: ignore[arg-type]
            thresholds=thresholds,
        )

    def configure_logging(self) -> None:
        level = getattr(logging, self.log_level.upper(), logging.INFO)
        logging.basicConfig(
            level=level,
            format="%(asctime)s %(levelname).1s health | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
