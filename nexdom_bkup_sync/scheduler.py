import asyncio
import os
from datetime import datetime, time
from typing import Dict, Any

from utils.logger import setup_logger
from backup import resolve_policy, create_local_snapshot, create_remote_snapshot


logger = setup_logger()


def parse_hhmm(s: str) -> time:
    hh, mm = s.split(":")
    return time(int(hh), int(mm))


async def scheduler_loop():
    last_local = None
    last_remote = None
    while True:
        policy = await resolve_policy()
        now = datetime.now()
        # Local daily
        if policy.get("local", {}).get("enabled", True):
            t = parse_hhmm(policy["local"].get("time", "03:00"))
            if now.time().hour == t.hour and now.time().minute == t.minute:
                if not last_local or (now.date() != last_local.date()):
                    logger.info("scheduled local backup")
                    await create_local_snapshot(policy)
                    last_local = now
        # Remote weekly
        if policy.get("remote", {}).get("enabled", True):
            t = parse_hhmm(policy["remote"].get("time", "03:00"))
            weekday = policy["remote"].get("day", "sunday").lower()
            if now.strftime("%A").lower() == weekday and now.time().hour == t.hour and now.time().minute == t.minute:
                if not last_remote or (now.isocalendar() != last_remote.isocalendar()):
                    logger.info("scheduled remote backup")
                    await create_remote_snapshot(policy)
                    last_remote = now
        await asyncio.sleep(30)


async def start_background():
    asyncio.create_task(scheduler_loop())