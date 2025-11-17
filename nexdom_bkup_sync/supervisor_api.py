import os
import aiohttp
from typing import Dict, Any


SUPERVISOR_URL = os.environ.get("SUPERVISOR_URL", "http://supervisor")
SUPERVISOR_TOKEN = os.environ.get("SUPERVISOR_TOKEN")


async def create_backup_full(name: str | None = None) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {SUPERVISOR_TOKEN}"} if SUPERVISOR_TOKEN else {}
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{SUPERVISOR_URL}/backups/new/full",
            json={"name": name} if name else {},
            headers=headers,
        ) as resp:
            return await resp.json()


async def create_backup_partial(include: Dict[str, Any], name: str | None = None) -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {SUPERVISOR_TOKEN}"} if SUPERVISOR_TOKEN else {}
    payload = {"name": name} if name else {}
    payload.update(include)
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{SUPERVISOR_URL}/backups/new/partial",
            json=payload,
            headers=headers,
        ) as resp:
            return await resp.json()


async def list_backups() -> Dict[str, Any]:
    headers = {"Authorization": f"Bearer {SUPERVISOR_TOKEN}"} if SUPERVISOR_TOKEN else {}
    async with aiohttp.ClientSession() as session:
        async with session.get(f"{SUPERVISOR_URL}/backups", headers=headers) as resp:
            return await resp.json()