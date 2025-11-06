from __future__ import annotations

import os
from typing import List

import aiohttp
from aiohttp import ClientResponseError, ClientTimeout

from .models import AddonUpdate, OfflineDevice


class HAClientError(RuntimeError):
    pass


class HAClient:
    """Cliente HTTP para interactuar con Home Assistant Core y Supervisor."""

    def __init__(self, ha_token: str, core_url: str, supervisor_url: str) -> None:
        self._ha_token = ha_token
        self._core_url = core_url
        self._supervisor_url = supervisor_url
        self._supervisor_token = os.getenv("SUPERVISOR_TOKEN", self._ha_token)
        self._session: aiohttp.ClientSession | None = None

    async def start(self) -> None:
        if self._session is None:
            timeout = ClientTimeout(total=20)
            self._session = aiohttp.ClientSession(timeout=timeout)

    async def close(self) -> None:
        if self._session is not None:
            await self._session.close()
            self._session = None

    async def list_addons_with_updates(self) -> List[AddonUpdate]:
        data = await self._supervisor_get("/addons")
        addons = data.get("addons", [])
        pending: List[AddonUpdate] = []
        for addon in addons:
            if addon.get("update_available"):
                pending.append(
                    AddonUpdate(
                        slug=addon["slug"],
                        name=addon.get("name", addon["slug"]),
                        version_installed=addon.get("version", "unknown"),
                        version_latest=addon.get("version_latest", "unknown"),
                    )
                )
        return pending

    async def list_offline_devices(self) -> List[OfflineDevice]:
        states = await self._core_get("/api/states")
        offline: List[OfflineDevice] = []
        for entity in states:
            entity_id = entity.get("entity_id")
            state = entity.get("state")
            if entity_id and state and state.lower() in {"unavailable", "unknown", "offline"}:
                attributes = entity.get("attributes") or {}
                offline.append(
                    OfflineDevice(
                        entity_id=entity_id,
                        state=state,
                        friendly_name=attributes.get("friendly_name"),
                    )
                )
        return offline

    async def update_addon(self, slug: str) -> None:
        await self._supervisor_post(f"/addons/{slug}/update")

    async def restart_core(self) -> None:
        await self._supervisor_post("/core/restart")

    async def _core_get(self, path: str) -> dict | list:
        return await self._request(
            method="GET",
            url=f"{self._core_url}{path}",
            headers={"Authorization": f"Bearer {self._ha_token}"},
        )

    async def _supervisor_get(self, path: str) -> dict:
        result = await self._request(
            method="GET",
            url=f"{self._supervisor_url}{path}",
            headers={"Authorization": f"Bearer {self._supervisor_token}"},
        )
        return result.get("data", result)

    async def _supervisor_post(self, path: str, payload: dict | None = None) -> dict:
        result = await self._request(
            method="POST",
            url=f"{self._supervisor_url}{path}",
            headers={"Authorization": f"Bearer {self._supervisor_token}"},
            json_payload=payload,
        )
        return result.get("data", result)

    async def _request(
        self,
        *,
        method: str,
        url: str,
        headers: dict[str, str],
        json_payload: dict | None = None,
    ) -> dict | list:
        if self._session is None:
            raise HAClientError("HAClient no inicializado. Llama a start() antes de usarlo.")

        async with self._session.request(
            method,
            url,
            json=json_payload,
            headers=headers,
            ssl=False,
        ) as response:
            try:
                response.raise_for_status()
            except ClientResponseError as exc:
                text = await response.text()
                raise HAClientError(f"Error {exc.status} al llamar {url}: {text}") from exc
            return await response.json(content_type=None)
