import os
import json
import asyncio
from datetime import datetime
from typing import Dict, Any

import yaml
from fastapi import FastAPI
from tenacity import RetryError

from utils.logger import setup_logger
from utils.lock import FileLock
from utils.validation import ensure_policy_defaults
from utils.retention import cleanup_local, list_backups

from supervisor_api import create_backup_full, create_backup_partial, list_backups as ha_list
from remote_policy import fetch_remote_policy, save_cache, load_cache
from policy_merge import merge_policy
from storage import supabase as supabase_storage
from storage import s3 as s3_storage
from storage import b2 as b2_storage


app = FastAPI()
logger = setup_logger()


def read_local_cfg() -> Dict[str, Any]:
    path = "/data/backups.yaml"
    if not os.path.exists(path):
        return ensure_policy_defaults({})
    try:
        with open(path) as f:
            data = yaml.safe_load(f) or {}
            return ensure_policy_defaults(data)
    except Exception as e:
        logger.error(f"backups.yaml read error: {e}")
        return ensure_policy_defaults({})


async def resolve_policy() -> Dict[str, Any]:
    local_cfg = read_local_cfg()
    if local_cfg.get("remote_config_enabled"):
        remote = await fetch_remote_policy(local_cfg.get("remote_config_endpoint", ""), local_cfg.get("client_id", ""), local_cfg.get("client_token", ""))
        if remote:
            save_cache(remote)
            merged = merge_policy(local_cfg, remote)
            logger.info("policy: remote active")
            return merged
        cache = load_cache()
        if cache:
            merged = merge_policy(local_cfg, cache)
            logger.warning("policy: using cached remote")
            return merged
        logger.warning("policy: fallback to local backups.yaml")
        return local_cfg
    cache = load_cache()
    if cache:
        merged = merge_policy(local_cfg, cache)
        logger.info("policy: remote disabled but cache applied")
        return merged
    logger.info("policy: local only")
    return local_cfg


def max_size_ok(path: str, max_gb: int) -> bool:
    try:
        size = os.path.getsize(path)
        return size <= max_gb * 1024 * 1024 * 1024
    except Exception:
        return True


def has_free_space_gb(path: str, required_gb: int) -> bool:
    try:
        st = os.statvfs(path)
        free_bytes = st.f_bavail * st.f_frsize
        return free_bytes >= required_gb * 1024 * 1024 * 1024
    except Exception:
        return True


async def upload_remote(file_path: str, storage_cfg: Dict[str, Any], dest_name: str, attempts: int, backoff: int) -> str:
    provider = storage_cfg.get("provider", "supabase")
    last_err = None
    for i in range(attempts):
        try:
            if provider == "supabase":
                return supabase_storage.upload(file_path, storage_cfg.get("url", ""), storage_cfg.get("bucket", ""), storage_cfg.get("token", ""), dest_name)
            if provider == "s3":
                return s3_storage.upload(file_path, storage_cfg.get("bucket", ""), storage_cfg.get("access_key", ""), storage_cfg.get("secret_key", ""), storage_cfg.get("region", "us-east-1"), dest_name)
            if provider == "b2":
                return b2_storage.upload(file_path, storage_cfg.get("bucket", ""), storage_cfg.get("key_id", ""), storage_cfg.get("app_key", ""), dest_name)
            raise ValueError("invalid storage provider")
        except Exception as e:
            last_err = e
            logger.warning(f"upload attempt {i+1}/{attempts} failed: {e}")
            await asyncio.sleep(backoff)
    raise RuntimeError(f"remote upload failed after {attempts} attempts: {last_err}")


async def create_local_snapshot(policy: Dict[str, Any], manual: bool = False) -> Dict[str, Any]:
    lock = FileLock()
    if not lock.acquire():
        return {"status": "busy"}
    try:
        required_gb = int(policy.get("limits", {}).get("max_snapshot_size_gb", 20))
        if not has_free_space_gb("/backup", required_gb):
            logger.error("insufficient local space; not creating backup")
            return {"status": "no_space"}
        include = {}
        if policy.get("local", {}).get("partial", False):
            include = {"addons": policy["local"].get("addons", []), "folders": policy["local"].get("folders", [])}
            resp = await create_backup_partial(include, name=f"NexDom Local {datetime.utcnow().isoformat()}")
        else:
            resp = await create_backup_full(name=f"NexDom Local {datetime.utcnow().isoformat()}")
        logger.info(f"local backup resp: {resp}")
        cleanup_local(policy.get("local", {}).get("retention_days", 7))
        return resp
    finally:
        lock.release()


async def create_remote_snapshot(policy: Dict[str, Any]) -> Dict[str, Any]:
    lock = FileLock()
    if not lock.acquire():
        return {"status": "busy"}
    try:
        required_gb = int(policy.get("limits", {}).get("max_snapshot_size_gb", 20))
        if not has_free_space_gb("/backup", required_gb):
            logger.error("insufficient local space; not creating backup for remote upload")
            return {"status": "no_space"}
        resp = await create_backup_full(name=f"NexDom Remote {datetime.utcnow().isoformat()}")
        logger.info(f"remote backup resp: {resp}")
        backups = list_backups("/backup")
        if not backups:
            return {"status": "no_backup"}
        latest_file = backups[0][0]
        max_gb = policy.get("limits", {}).get("max_snapshot_size_gb", 20)
        if not max_size_ok(latest_file, max_gb):
            logger.warning("snapshot exceeds max size, not uploading")
            return {"status": "too_large"}
        dest_name = f"{policy.get('client_id','client')}-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}.tar"
        attempts = int(policy.get("limits", {}).get("retry_attempts", 3))
        backoff = int(policy.get("limits", {}).get("retry_backoff_seconds", 30))
        url = await upload_remote(latest_file, policy.get("storage", {}), dest_name, attempts, backoff)
        try:
            with open("/data/last_remote.json", "w") as f:
                json.dump({
                    "file": os.path.basename(latest_file),
                    "dest_name": dest_name,
                    "url": url,
                    "size_bytes": os.path.getsize(latest_file),
                    "created_at": datetime.utcnow().isoformat(),
                }, f)
        except Exception:
            pass
        return {"status": "uploaded", "url": url}
    finally:
        lock.release()


@app.post("/service/create_local_backup")
async def svc_create_local():
    policy = await resolve_policy()
    res = await create_local_snapshot(policy, manual=True)
    try:
        backups = list_backups("/backup")
        if backups:
            latest_file = backups[0][0]
            with open("/data/last_local.json", "w") as f:
                json.dump({
                    "file": os.path.basename(latest_file),
                    "size_bytes": os.path.getsize(latest_file),
                    "created_at": datetime.utcnow().isoformat(),
                }, f)
    except Exception:
        pass
    return res


@app.post("/service/create_remote_backup")
async def svc_create_remote():
    policy = await resolve_policy()
    return await create_remote_snapshot(policy)


@app.post("/service/refresh_policy")
async def svc_refresh_policy():
    policy = await resolve_policy()
    return {"status": "ok", "policy": policy}


@app.post("/service/cleanup_local")
async def svc_cleanup_local():
    policy = await resolve_policy()
    count = cleanup_local(policy.get("local", {}).get("retention_days", 7))
    return {"deleted": count}


@app.post("/service/cleanup_remote")
async def svc_cleanup_remote():
    policy = await resolve_policy()
    provider = policy.get("storage", {}).get("provider", "supabase")
    retention_weeks = policy.get("remote", {}).get("retention_weeks", 8)
    prefix = f"{policy.get('client_id','client')}-"
    if provider == "supabase":
        url = policy["storage"].get("url", "")
        bucket = policy["storage"].get("bucket", "")
        token = policy["storage"].get("token", "")
        objs = supabase_storage.list_objects(url, bucket, token, prefix=prefix)
        ours = objs
        sorted_objs = sorted(ours, key=lambda o: o.get("updated_at", ""), reverse=True)
        to_delete = [o["name"] for o in sorted_objs[retention_weeks:]]
        supabase_storage.delete_objects(url, bucket, token, to_delete)
        return {"deleted": len(to_delete)}
    if provider == "s3":
        bucket = policy["storage"].get("bucket", "")
        access_key = policy["storage"].get("access_key", "")
        secret_key = policy["storage"].get("secret_key", "")
        region = policy["storage"].get("region", "us-east-1")
        objs = s3_storage.list_objects(bucket, access_key, secret_key, region, prefix=prefix)
        ours = objs
        sorted_objs = sorted(ours, key=lambda o: o.get("updated_at", ""), reverse=True)
        to_delete = [o["name"] for o in sorted_objs[retention_weeks:]]
        s3_storage.delete_objects(bucket, access_key, secret_key, region, to_delete)
        return {"deleted": len(to_delete)}
    if provider == "b2":
        bucket = policy["storage"].get("bucket", "")
        key_id = policy["storage"].get("key_id", "")
        app_key = policy["storage"].get("app_key", "")
        objs = b2_storage.list_objects(bucket, key_id, app_key, prefix=prefix)
        ours = objs
        sorted_objs = sorted(ours, key=lambda o: o.get("updated_at", 0), reverse=True)
        to_delete = [o["name"] for o in sorted_objs[retention_weeks:]]
        b2_storage.delete_objects(bucket, key_id, app_key, to_delete)
        return {"deleted": len(to_delete)}
    return {"status": "unsupported"}


@app.get("/service/status")
async def svc_status():
    policy = await resolve_policy()
    ha_backups = await ha_list()
    local_latest = list_backups("/backup")
    status = {
        "policy": policy,
        "ha_backups": ha_backups,
        "local_latest": local_latest[0][0] if local_latest else None,
        "local_latest_size": os.path.getsize(local_latest[0][0]) if local_latest else None,
    }
    try:
        log_path = "/data/logs/backup.log"
        if os.path.exists(log_path):
            with open(log_path, "r", errors="ignore") as lf:
                lines = lf.readlines()[-200:]
                errs = [l.strip() for l in lines if "ERROR" in l]
                status["errors"] = errs[-10:]
    except Exception:
        pass
    try:
        if os.path.exists("/data/last_local.json"):
            with open("/data/last_local.json") as f:
                status["last_local"] = json.load(f)
        if os.path.exists("/data/last_remote.json"):
            with open("/data/last_remote.json") as f:
                status["last_remote"] = json.load(f)
    except Exception:
        pass
    return status


@app.on_event("startup")
async def startup_event():
    try:
        from scheduler import start_background
        await start_background()
        logger.info("scheduler started")
    except Exception as e:
        logger.error(f"scheduler start failed: {e}")