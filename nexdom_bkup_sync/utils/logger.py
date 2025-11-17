import logging
import os
from logging.handlers import RotatingFileHandler


def setup_logger(name: str = "nexdom_backup") -> logging.Logger:
    logger = logging.getLogger(name)
    if logger.handlers:
        return logger
    logger.setLevel(logging.INFO)
    log_dir = "/data/logs"
    os.makedirs(log_dir, exist_ok=True)
    handler = RotatingFileHandler(os.path.join(log_dir, "backup.log"), maxBytes=5 * 1024 * 1024, backupCount=3)
    formatter = logging.Formatter("%(asctime)s %(levelname)s %(message)s")
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    console = logging.StreamHandler()
    console.setFormatter(formatter)
    logger.addHandler(console)
    return logger