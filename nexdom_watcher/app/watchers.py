from __future__ import annotations

import asyncio
import logging

from .ha_client import HAClient
from .mqtt_service import MQTTManager
from .state import StateTracker
from .utils import topic_safe, utcnow_iso


class TopicBuilder:
    def __init__(self, base_topic: str, client_id: str) -> None:
        self._prefix = f"{base_topic}/{client_id}"

    def status_addon(self, slug: str) -> str:
        return f"{self._prefix}/status/addons/{topic_safe(slug)}"

    def status_resolved_addon(self, slug: str) -> str:
        return f"{self._prefix}/status_resolved/addons/{topic_safe(slug)}"

    def status_device(self, entity_id: str) -> str:
        return f"{self._prefix}/status/devices/{topic_safe(entity_id)}"

    def status_resolved_device(self, entity_id: str) -> str:
        return f"{self._prefix}/status_resolved/devices/{topic_safe(entity_id)}"

    def status_action(self) -> str:
        return f"{self._prefix}/status/actions"


class WatcherBase:
    def __init__(self, *, interval: int) -> None:
        self._interval = interval
        self._stop_event = asyncio.Event()
        self._logger = logging.getLogger(self.__class__.__name__.lower())
        self._lock = asyncio.Lock()

    async def run_forever(self) -> None:
        while not self._stop_event.is_set():
            try:
                await self.run_once()
            except Exception:  # noqa: BLE001
                self._logger.exception("Error durante el ciclo de monitoreo")
            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=self._interval)
            except asyncio.TimeoutError:
                continue

    async def stop(self) -> None:
        self._stop_event.set()

    async def run_once(self) -> None:
        async with self._lock:
            await self._run_cycle()

    async def _run_cycle(self) -> None:
        raise NotImplementedError


class AddonWatcher(WatcherBase):
    def __init__(
        self,
        *,
        interval: int,
        ha_client: HAClient,
        mqtt: MQTTManager,
        topic_builder: TopicBuilder,
        publish_retain: bool,
        client_id: str,
    ) -> None:
        super().__init__(interval=interval)
        self._ha = ha_client
        self._mqtt = mqtt
        self._topics = topic_builder
        self._publish_retain = publish_retain
        self._tracker = StateTracker("addons")
        self._client_id = client_id

    async def _run_cycle(self) -> None:
        updates = await self._ha.list_addons_with_updates()
        timestamp = utcnow_iso()
        new_ids, resolved_ids = self._tracker.diff(update.identifier for update in updates)
        if new_ids:
            self._logger.info("Add-ons pendientes: %s", ", ".join(sorted(new_ids)))
        if resolved_ids:
            self._logger.info("Add-ons resueltos: %s", ", ".join(sorted(resolved_ids)))

        for update in updates:
            payload = {
                "type": "addon_update",
                "addon": update.slug,
                "addon_name": update.name,
                "status": "pending",
                "version": update.version_latest,
                "installed": update.version_installed,
                "ts": timestamp,
                "id": update.identifier,
                "client_id": self._client_id,
            }
            topic = self._topics.status_addon(update.slug)
            await self._mqtt.publish_json(topic, payload, retain=self._publish_retain)

        for identifier in resolved_ids:
            slug = identifier.split(":", 1)[1]
            await self._publish_resolved_addon(slug, timestamp, identifier)

    async def _publish_resolved_addon(self, slug: str, timestamp: str, identifier: str) -> None:
        resolved_payload = {
            "type": "addon_update",
            "addon": slug,
            "status": "resolved",
            "ts": timestamp,
            "id": identifier,
            "client_id": self._client_id,
        }
        await self._mqtt.publish_json(self._topics.status_resolved_addon(slug), resolved_payload, retain=False)
        if self._publish_retain:
            await self._mqtt.publish_raw(self._topics.status_addon(slug), b"", retain=True)


class DeviceWatcher(WatcherBase):
    def __init__(
        self,
        *,
        interval: int,
        ha_client: HAClient,
        mqtt: MQTTManager,
        topic_builder: TopicBuilder,
        publish_retain: bool,
        client_id: str,
    ) -> None:
        super().__init__(interval=interval)
        self._ha = ha_client
        self._mqtt = mqtt
        self._topics = topic_builder
        self._publish_retain = publish_retain
        self._tracker = StateTracker("devices")
        self._client_id = client_id

    async def _run_cycle(self) -> None:
        devices = await self._ha.list_offline_devices()
        timestamp = utcnow_iso()
        new_ids, resolved_ids = self._tracker.diff(device.identifier for device in devices)
        if new_ids:
            self._logger.info("Dispositivos offline: %s", ", ".join(sorted(new_ids)))
        if resolved_ids:
            self._logger.info("Dispositivos restablecidos: %s", ", ".join(sorted(resolved_ids)))

        for device in devices:
            payload = {
                "type": "device_offline",
                "entity_id": device.entity_id,
                "status": device.state,
                "friendly_name": device.friendly_name,
                "ts": timestamp,
                "id": device.identifier,
                "client_id": self._client_id,
            }
            topic = self._topics.status_device(device.entity_id)
            await self._mqtt.publish_json(topic, payload, retain=self._publish_retain)

        for identifier in resolved_ids:
            entity = identifier.split(":", 1)[1]
            await self._publish_resolved_device(entity, timestamp, identifier)

    async def _publish_resolved_device(self, entity_id: str, timestamp: str, identifier: str) -> None:
        resolved_payload = {
            "type": "device_offline",
            "entity_id": entity_id,
            "status": "resolved",
            "ts": timestamp,
            "id": identifier,
            "client_id": self._client_id,
        }
        await self._mqtt.publish_json(
            self._topics.status_resolved_device(entity_id),
            resolved_payload,
            retain=False,
        )
        if self._publish_retain:
            await self._mqtt.publish_raw(self._topics.status_device(entity_id), b"", retain=True)
