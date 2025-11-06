from __future__ import annotations

import asyncio
import contextlib
import json
import logging
from dataclasses import dataclass
from typing import Awaitable, Callable, Optional

from asyncio_mqtt import Client, MqttError, Topic

MessageHandler = Callable[[str, str], Awaitable[None]]


@dataclass
class Subscription:
    topic_filter: str
    handler: MessageHandler

    def matches(self, topic: str) -> bool:
        return Topic(self.topic_filter).matches(topic)


class MQTTManager:
    def __init__(
        self,
        *,
        host: str,
        port: int,
        username: str,
        password: str,
        client_id: str,
        subscriptions: Optional[list[Subscription]] = None,
    ) -> None:
        self._host = host
        self._port = port
        self._username = username
        self._password = password
        self._client_id = client_id
        self._subscriptions = subscriptions or []
        self._connected = asyncio.Event()
        self._publish_lock = asyncio.Lock()
        self._client: Client | None = None
        self._runner: asyncio.Task[None] | None = None
        self._logger = logging.getLogger("mqtt")

    async def start(self) -> None:
        if self._runner is None:
            self._runner = asyncio.create_task(self._run())
        elif self._runner.done():
            self._runner = asyncio.create_task(self._run())

    async def stop(self) -> None:
        if self._runner is not None:
            self._runner.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._runner
            self._runner = None
        if self._client is not None:
            await self._client.disconnect()
            self._client = None
        self._connected.clear()

    async def publish_json(self, topic: str, payload: dict, *, qos: int = 1, retain: bool = False) -> None:
        message = json.dumps(payload, ensure_ascii=False)
        await self.publish_raw(topic, message.encode("utf-8"), qos=qos, retain=retain)

    async def publish_raw(self, topic: str, payload: bytes, *, qos: int = 1, retain: bool = False) -> None:
        while True:
            await self._connected.wait()
            client = self._client
            if client is None:
                self._connected.clear()
                await asyncio.sleep(1)
                continue

            try:
                async with self._publish_lock:
                    await client.publish(topic, payload, qos=qos, retain=retain)
                return
            except MqttError as exc:
                self._logger.warning("Error publicando en %s: %s", topic, exc)
                self._connected.clear()
                await asyncio.sleep(1)

    def configure_subscriptions(self, subscriptions: list[Subscription]) -> None:
        self._subscriptions = subscriptions

    async def _run(self) -> None:
        reconnect_delay = ReconnectDelay()
        while True:
            try:
                async with Client(
                    hostname=self._host,
                    port=self._port,
                    username=self._username or None,
                    password=self._password or None,
                    client_id=f"{self._client_id}-watcher",
                ) as client:
                    self._client = client
                    await self._on_connect(client)
                    reconnect_delay.reset()
                    async with client.messages() as messages:
                        await self._subscribe_all(client)
                        self._connected.set()
                        async for message in messages:
                            payload = message.payload.decode("utf-8", errors="ignore")
                            await self._dispatch(message.topic, payload)
            except MqttError as exc:
                self._logger.error("Conexión MQTT perdida: %s", exc)
                self._connected.clear()
                self._client = None
                await asyncio.sleep(reconnect_delay.next_delay())

    async def _on_connect(self, client: Client) -> None:
        self._logger.info(
            "Conectado a MQTT %s:%s como %s",
            self._host,
            self._port,
            self._client_id,
        )

    async def _subscribe_all(self, client: Client) -> None:
        for subscription in self._subscriptions:
            await client.subscribe(subscription.topic_filter, qos=1)
            self._logger.info("Suscrito a %s", subscription.topic_filter)

    async def _dispatch(self, topic: str, payload: str) -> None:
        for subscription in self._subscriptions:
            if subscription.matches(topic):
                asyncio.create_task(self._safe_call(subscription.handler, topic, payload))

    async def _safe_call(self, handler: MessageHandler, topic: str, payload: str) -> None:
        try:
            await handler(topic, payload)
        except Exception:  # noqa: BLE001
            self._logger.exception("Error manejando mensaje %s", topic)


class ReconnectDelay:
    def __init__(self, base: float = 1.0, maximum: float = 30.0) -> None:
        self._base = base
        self._maximum = maximum
        self._current = base

    def reset(self) -> None:
        self._current = self._base

    def next_delay(self) -> float:
        delay = self._current
        self._current = min(self._current * 2, self._maximum)
        return delay
