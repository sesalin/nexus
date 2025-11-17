import os
import json
import aiohttp
from typing import Dict, Any
from utils.logger import setup_logger


logger = setup_logger()
CACHE_PATH = "/data/backup_policy.json"
LOCAL_CFG_PATH = "/data/backups.yaml"


async def fetch_remote_policy(endpoint: str, client_id: str, token: str) -> Dict[str, Any] | None:
    url = f"{endpoint}?client_id={client_id}&token={token}"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=20) as resp:
                if resp.status != 200:
                    logger.warning(f"remote policy http {resp.status}")
                    return None
                return await resp.json()
    except Exception as e:
        logger.error(f"remote policy fetch error: {e}")
        return None


def save_cache(policy: Dict[str, Any]) -> None:
    try:
        with open(CACHE_PATH, "w") as f:
            json.dump(policy, f)
    except Exception as e:
        logger.error(f"cache save error: {e}")


def load_cache() -> Dict[str, Any] | None:
    try:
        if not os.path.exists(CACHE_PATH):
            return None
        with open(CACHE_PATH) as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"cache load error: {e}")
        return None