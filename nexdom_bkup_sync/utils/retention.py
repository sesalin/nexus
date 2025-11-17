import os
import time
from typing import List, Tuple


def list_backups(path: str = "/backup") -> List[Tuple[str, float]]:
    items = []
    if not os.path.isdir(path):
        return items
    for name in os.listdir(path):
        if name.endswith(".tar"):
            full = os.path.join(path, name)
            items.append((full, os.path.getmtime(full)))
    items.sort(key=lambda x: x[1], reverse=True)
    return items


def cleanup_local(retention_days: int, path: str = "/backup") -> int:
    threshold = time.time() - (retention_days * 24 * 3600)
    deleted = 0
    for f, mtime in list_backups(path):
        if mtime < threshold:
            try:
                os.remove(f)
                deleted += 1
            except Exception:
                pass
    return deleted