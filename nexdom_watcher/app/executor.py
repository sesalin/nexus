from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from .ha_client import HAClient, HAClientError
from .mqtt_service import MQTTManager
from .utils import utcnow_iso
from .watchers import AddonWatcher, DeviceWatcher, TopicBuilder


class ActionError(RuntimeError):
    """Error ya notificado a través de MQTT."""


class ActionExecutor:
    def __init__(
        self,
        *,
        ha_client: HAClient,
        mqtt: MQTTManager,
        topic_builder: TopicBuilder,
        addon_watcher: AddonWatcher,
        device_watcher: DeviceWatcher,
        client_id: str,
    ) -> None:
        self._ha = ha_client
        self._mqtt = mqtt
        self._topics = topic_builder
        self._addon_watcher = addon_watcher
        self._device_watcher = device_watcher
        self._client_id = client_id
        self._logger = logging.getLogger("executor")
        self._lock = asyncio.Lock()

    async def handle_action(self, payload: dict[str, Any]) -> None:
        action = payload.get("action")
        if not action:
            raise ValueError("Payload de acción sin campo 'action'")

        if action == "update_addon":
            slug = payload.get("addon")
            if not slug:
                raise ValueError("Acción update_addon requiere campo 'addon'")
            await self._perform_addon_update(slug)
        elif action == "core_restart":
            await self._perform_core_restart()
        else:
            raise ValueError(f"Acción desconocida: {action}")

    async def _perform_addon_update(self, slug: str) -> None:
        async with self._lock:
            await self._publish_action_status("update_addon", slug, "running")
            try:
                await self._ha.update_addon(slug)
            except HAClientError as exc:
                await self._publish_action_status("update_addon", slug, "error", str(exc))
                raise ActionError(str(exc))
            else:
                await self._publish_action_status("update_addon", slug, "success")
                await self._addon_watcher.run_once()

    async def _perform_core_restart(self) -> None:
        async with self._lock:
            await self._publish_action_status("core_restart", "homeassistant", "running")
            try:
                await self._ha.restart_core()
            except HAClientError as exc:
                await self._publish_action_status("core_restart", "homeassistant", "error", str(exc))
                raise ActionError(str(exc))
            else:
                await self._publish_action_status("core_restart", "homeassistant", "success")
                await self._device_watcher.run_once()

    async def _publish_action_status(self, action: str, target: str, status: str, error: str | None = None) -> None:
        payload = {
            "type": "action",
            "action": action,
            "target": target,
            "status": status,
            "ts": utcnow_iso(),
            "client_id": self._client_id,
        }
        if error:
            payload["error"] = error
        await self._mqtt.publish_json(self._topics.status_action(), payload, retain=False)

    async def handle_action_message(self, topic: str, raw_payload: str) -> None:
        try:
            payload = json.loads(raw_payload or "{}")
            await self.handle_action(payload)
        except ActionError:
            self._logger.warning("Acción reportó error: %s", raw_payload)
        except Exception as exc:  # noqa: BLE001
            self._logger.exception("Acción falló (%s): %s", topic, exc)
            await self._publish_action_status("unknown", topic, "error", str(exc))

    async def handle_recheck_message(self, topic: str, raw_payload: str) -> None:
        try:
            payload = json.loads(raw_payload or "{}")
        except json.JSONDecodeError as exc:
            self._logger.warning("Payload inválido en recheck %s: %s", topic, exc)
            return

        target_type = payload.get("type", "all")
        self._logger.info("Recheck solicitado: %s", target_type)

        if target_type == "addon":
            await self._addon_watcher.run_once()
        elif target_type == "device":
            await self._device_watcher.run_once()
        elif target_type == "all":
            await self._addon_watcher.run_once()
            await self._device_watcher.run_once()
        else:
            self._logger.warning("Tipo de recheck desconocido: %s", target_type)
