from typing import Any, Dict


def ensure_policy_defaults(cfg: Dict[str, Any]) -> Dict[str, Any]:
    cfg = cfg or {}
    cfg.setdefault("remote_config_enabled", False)
    cfg.setdefault("remote_config_endpoint", "")
    cfg.setdefault("client_id", "")
    cfg.setdefault("client_token", "")
    cfg.setdefault("local", {})
    cfg.setdefault("remote", {})
    cfg.setdefault("storage", {})
    cfg.setdefault("limits", {})
    cfg.setdefault("logging", {})

    local = cfg["local"]
    local.setdefault("enabled", True)
    local.setdefault("frequency", "daily")
    local.setdefault("retention_days", 7)
    local.setdefault("time", "03:00")
    local.setdefault("partial", False)
    local.setdefault("addons", [])
    local.setdefault("folders", [])

    remote = cfg["remote"]
    remote.setdefault("enabled", True)
    remote.setdefault("frequency", "weekly")
    remote.setdefault("day", "sunday")
    remote.setdefault("retention_weeks", 8)
    remote.setdefault("time", "03:00")

    limits = cfg["limits"]
    limits.setdefault("max_snapshot_size_gb", 20)
    limits.setdefault("retry_attempts", 3)
    limits.setdefault("retry_backoff_seconds", 30)

    logging = cfg["logging"]
    logging.setdefault("notify_on_failure", True)
    return cfg