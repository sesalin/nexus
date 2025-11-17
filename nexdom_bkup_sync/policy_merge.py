from typing import Any, Dict


def merge_policy(local_cfg: Dict[str, Any], remote: Dict[str, Any] | None) -> Dict[str, Any]:
    result = dict(local_cfg)
    if remote and remote.get("backup_policy"):
        rp = remote["backup_policy"]
        result.setdefault("local", {}).update(rp.get("local", {}))
        result.setdefault("remote", {}).update(rp.get("remote", {}))
    return result