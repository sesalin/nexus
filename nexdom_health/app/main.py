from __future__ import annotations

import asyncio
import logging
import os
import signal
from pathlib import Path

import contextlib
from .config import Config
from .health import HealthCollector, post_payload

DEFAULT_OPTIONS = Path(os.getenv("OPTIONS_PATH", "/data/options.json"))
LOGGER = logging.getLogger("health")


async def worker(config: Config) -> None:
    collector = HealthCollector(config)
    interval = config.interval_seconds

    while True:
        try:
            payload = collector.gather()
            LOGGER.info(
                "Reporte %s | haos=%s updates=%s devices=%s storage=%s",
                payload["client"],
                payload["status"]["haos_up"]["state"],
                payload["status"]["updates"]["state"],
                payload["status"]["devices"]["state"],
                payload["status"]["storage"]["state"],
            )
            post_payload(config.webhook_url, payload)
        except Exception:  # noqa: BLE001
            LOGGER.exception("Error generando o enviando reporte")

        await asyncio.sleep(interval)


async def async_main() -> None:
    config = Config.load(DEFAULT_OPTIONS)
    config.configure_logging()
    LOGGER.info("Nexdom Health Reporter iniciado | cliente=%s", config.client_id)

    task = asyncio.create_task(worker(config))

    stop_event = asyncio.Event()

    def _signal_handler(signame: str) -> None:
        LOGGER.info("Recibida señal %s, deteniendo...", signame)
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _signal_handler, sig.name)
        except NotImplementedError:
            pass

    await stop_event.wait()
    task.cancel()
    with contextlib.suppress(asyncio.CancelledError):
        await task
    LOGGER.info("Nexdom Health Reporter detenido")


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
