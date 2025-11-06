from __future__ import annotations

import logging
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Dict, List

import requests

from .config import Config

LOGGER = logging.getLogger("health")


@dataclass
class Status:
    state: str
    detail: str

    def to_dict(self) -> Dict[str, str]:
        return {"state": self.state, "detail": self.detail}


class HAClient:
    CORE_URL = "http://homeassistant:8123"
    SUPERVISOR_URL = "http://supervisor"

    def __init__(self, token: str) -> None:
        self._session = requests.Session()
        self._headers = {
            "Authorization": f"Bearer {token}",
        }

    def get_core(self, path: str, timeout: float = 10.0) -> Any:
        return self._request(self.CORE_URL + path, timeout=timeout)

    def get_supervisor(self, path: str, timeout: float = 10.0) -> Any:
        return self._request(self.SUPERVISOR_URL + path, timeout=timeout)

    def _request(self, url: str, *, timeout: float) -> Any:
        response = self._session.get(url, headers=self._headers, timeout=timeout)
        response.raise_for_status()
        try:
            return response.json()
        except ValueError:
            return response.text


class HealthCollector:
    OFFLINE_STATES = {"unavailable", "offline", "unknown"}

    def __init__(self, config: Config) -> None:
        self._config = config
        self._client = HAClient(config.ha_token)

    def gather(self) -> Dict[str, Any]:
        results: Dict[str, Status] = {}
        meta: Dict[str, Any] = {}

        ha_status = self._check_haos()
        results["haos_up"] = ha_status

        addons_status, addons_list = self._check_addons()
        results["updates"] = addons_status
        meta["pending_addons"] = addons_list

        devices_status, offline_entities = self._check_devices()
        results["devices"] = devices_status
        meta["offline_entities"] = offline_entities

        storage_status = self._check_storage()
        results["storage"] = storage_status

        payload = {
            "client": self._config.client_id,
            "ts": datetime.now(timezone.utc).isoformat(),
            "status": {k: v.to_dict() for k, v in results.items()},
            "meta": meta,
        }
        return payload

    def _check_haos(self) -> Status:
        try:
            self._client.get_core("/api/")
            return Status("ok", "Core reachable")
        except requests.RequestException as exc:
            LOGGER.warning("Core inaccesible: %s", exc)
            return Status("error", f"core_unreachable: {exc}")

    def _check_addons(self) -> tuple[Status, List[str]]:
        try:
            data = self._client.get_supervisor("/addons")
        except requests.RequestException as exc:
            LOGGER.warning("Supervisor inaccesible: %s", exc)
            return Status("error", f"supervisor_unreachable: {exc}"), []

        addons = data.get("data", {}).get("addons", []) if isinstance(data, dict) else []
        pending = [
            f"{addon.get('slug')} ({addon.get('version')}→{addon.get('version_latest')})"
            for addon in addons
            if addon.get("update_available")
        ]

        if not pending:
            return Status("ok", "sin_actualizaciones"), []

        detail = ", ".join(pending[:5])
        if len(pending) > 5:
            detail += f" … (+{len(pending) - 5})"
        return Status("warn", detail), pending

    def _check_devices(self) -> tuple[Status, List[str]]:
        try:
            states = self._client.get_core("/api/states")
        except requests.RequestException as exc:
            LOGGER.warning("No se pudo leer /api/states: %s", exc)
            return Status("error", f"states_unreachable: {exc}"), []

        if not isinstance(states, list):
            return Status("error", "respuesta inválida /api/states"), []

        offline_entities = [
            entity["entity_id"]
            for entity in states
            if entity.get("state") in self.OFFLINE_STATES
        ]

        count = len(offline_entities)
        if count == 0:
            return Status("ok", "0 offline"), []

        if count <= self._config.thresholds.device_warn:
            state = "warn"
        elif count <= self._config.thresholds.device_error:
            state = "warn"
        else:
            state = "error"

        detail_entities = ", ".join(offline_entities[:3])
        if len(offline_entities) > 3:
            detail_entities += f" … (+{len(offline_entities) - 3})"
        detail = f"{count} offline: {detail_entities}"
        return Status(state, detail), offline_entities

    def _check_storage(self) -> Status:
        try:
            info = self._client.get_supervisor("/host/info")
        except requests.RequestException as exc:
            LOGGER.warning("No se pudo leer host/info: %s", exc)
            return Status("error", f"host_info_unreachable: {exc}")

        data = info.get("data", {}) if isinstance(info, dict) else {}
        total = float(data.get("disk_total", 0) or 0)
        free = float(data.get("disk_free", 0) or 0)

        if total <= 0:
            return Status("warn", "sin_datos_almacenamiento")

        free_percent = (free / total) * 100
        detail = f"{free_percent:.1f}% libre"
        if free_percent <= self._config.thresholds.storage_error_free:
            return Status("error", detail)
        if free_percent <= self._config.thresholds.storage_warn_free:
            return Status("warn", detail)
        return Status("ok", detail)


def post_payload(webhook_url: str, payload: Dict[str, Any]) -> None:
    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        response.raise_for_status()
    except requests.RequestException as exc:
        LOGGER.error("Error enviando webhook: %s", exc)
        raise
