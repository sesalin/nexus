import os
import time


LOCK_PATH = "/data/.nexdom_backup.lock"


class FileLock:
    def __init__(self, path: str = LOCK_PATH, timeout: int = 5 * 60):
        self.path = path
        self.timeout = timeout

    def acquire(self) -> bool:
        start = time.time()
        while os.path.exists(self.path):
            if time.time() - start > self.timeout:
                return False
            time.sleep(1)
        with open(self.path, "w") as f:
            f.write(str(os.getpid()))
        return True

    def release(self) -> None:
        try:
            if os.path.exists(self.path):
                os.remove(self.path)
        except Exception:
            pass