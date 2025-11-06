from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator


class RawConfig(BaseModel):
    model_config = ConfigDict(extra="ignore")
    mqtt_host: str = Field(default="core-mosquitto")
    mqtt_port: int = Field(default=1883)
    mqtt_user: str = Field(default="telegraf")
    mqtt_password: str = Field(default="telegraf123")
    mqtt_base_topic: str = Field(default="nexdom")
    client_id: str = Field(default="haos_cliente")
    ha_token: str = Field(default="")
    ha_core_url: str = Field(default="http://homeassistant:8123")
    ha_supervisor_url: str = Field(default="http://supervisor")
    addons_check_seconds: int = Field(default=43200)
    devices_check_seconds: int = Field(default=300)
    publish_retain: bool = Field(default=True)
    log_level: Literal["debug", "info", "warning", "error"] = Field(default="info")

    @field_validator("mqtt_base_topic")
    @classmethod
    def _strip_trailing_slash(cls, value: str) -> str:
        return value.rstrip("/")


@dataclass
class Intervals:
    addons: int
    devices: int


@dataclass
class Config:
    mqtt_host: str
    mqtt_port: int
    mqtt_user: str
    mqtt_password: str
    mqtt_base_topic: str
    client_id: str
    ha_token: str
    ha_core_url: str
    ha_supervisor_url: str
    publish_retain: bool
    log_level: str
    intervals: Intervals

    @classmethod
    def load(cls, path: Path) -> "Config":
        if not path.exists():
            raise FileNotFoundError(f"No se encontró el archivo de configuración: {path}")

        with path.open("r", encoding="utf-8") as handle:
            raw_data = json.load(handle)

        try:
            raw = RawConfig(**raw_data)
        except ValidationError as exc:
            raise ValueError(f"Configuración inválida: {exc}") from exc

        if not raw.ha_token:
            raise ValueError("Debe configurar 'ha_token' con un Long-Lived Access Token de Home Assistant.")

        intervals = Intervals(
            addons=max(60, raw.addons_check_seconds),
            devices=max(30, raw.devices_check_seconds),
        )

        return cls(
            mqtt_host=raw.mqtt_host,
            mqtt_port=raw.mqtt_port,
            mqtt_user=raw.mqtt_user,
            mqtt_password=raw.mqtt_password,
            mqtt_base_topic=raw.mqtt_base_topic,
            client_id=raw.client_id,
            ha_token=raw.ha_token,
            ha_core_url=raw.ha_core_url.rstrip("/"),
            ha_supervisor_url=raw.ha_supervisor_url.rstrip("/"),
            publish_retain=raw.publish_retain,
            log_level=raw.log_level,
            intervals=intervals,
        )

    def configure_logging(self) -> None:
        level = getattr(logging, self.log_level.upper(), logging.INFO)
        logging.basicConfig(
            level=level,
            format="%(asctime)s %(levelname).1s %(name)s | %(message)s",
            datefmt="%Y-%m-%dT%H:%M:%S",
        )
