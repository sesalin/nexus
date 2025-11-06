from __future__ import annotations

import asyncio
import logging
import os
import signal
from pathlib import Path

from .config import Config
from .executor import ActionExecutor
from .ha_client import HAClient
from .mqtt_service import MQTTManager, Subscription
from .utils import utcnow_iso
from .watchers import AddonWatcher, DeviceWatcher, TopicBuilder

DEFAULT_OPTIONS_PATH = "/data/options.json"


async def async_main() -> None:
    options_path = Path(os.getenv("OPTIONS_PATH", DEFAULT_OPTIONS_PATH))
    config = Config.load(options_path)
    config.configure_logging()

    logger = logging.getLogger("main")
    logger.info("Nexdom Watcher Executor iniciado | cliente=%s", config.client_id)

    ha_client = HAClient(
        ha_token=config.ha_token,
        core_url=config.ha_core_url,
        supervisor_url=config.ha_supervisor_url,
    )
    await ha_client.start()

    topic_builder = TopicBuilder(config.mqtt_base_topic, config.client_id)

    mqtt_manager = MQTTManager(
        host=config.mqtt_host,
        port=config.mqtt_port,
        username=config.mqtt_user,
        password=config.mqtt_password,
        client_id=config.client_id,
    )

    addon_watcher = AddonWatcher(
        interval=config.intervals.addons,
        ha_client=ha_client,
        mqtt=mqtt_manager,
        topic_builder=topic_builder,
        publish_retain=config.publish_retain,
        client_id=config.client_id,
    )

    device_watcher = DeviceWatcher(
        interval=config.intervals.devices,
        ha_client=ha_client,
        mqtt=mqtt_manager,
        topic_builder=topic_builder,
        publish_retain=config.publish_retain,
        client_id=config.client_id,
    )

    executor = ActionExecutor(
        ha_client=ha_client,
        mqtt=mqtt_manager,
        topic_builder=topic_builder,
        addon_watcher=addon_watcher,
        device_watcher=device_watcher,
        client_id=config.client_id,
    )

    client_topic_prefix = f"{config.mqtt_base_topic}/{config.client_id}"
    subscriptions = [
        Subscription(
            topic_filter=f"{client_topic_prefix}/actions/#",
            handler=executor.handle_action_message,
        ),
        Subscription(
            topic_filter=f"{client_topic_prefix}/control/recheck",
            handler=executor.handle_recheck_message,
        ),
    ]
    mqtt_manager.configure_subscriptions(subscriptions)

    await mqtt_manager.start()

    watcher_tasks = [
        asyncio.create_task(addon_watcher.run_forever(), name="addons_watcher"),
        asyncio.create_task(device_watcher.run_forever(), name="devices_watcher"),
    ]

    stop_event = asyncio.Event()

    def _handle_stop(signame: str) -> None:
        logger.info("Señal %s recibida, deteniendo servicio…", signame)
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        try:
            loop.add_signal_handler(sig, _handle_stop, sig.name)
        except NotImplementedError:
            # Entornos sin soporte de señales (Windows)
            pass

    try:
        await stop_event.wait()
    finally:
        for task in watcher_tasks:
            task.cancel()
        await asyncio.gather(*watcher_tasks, return_exceptions=True)
        await mqtt_manager.stop()
        await ha_client.close()
        logger.info("Servicio detenido %s", utcnow_iso())


def main() -> None:
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
