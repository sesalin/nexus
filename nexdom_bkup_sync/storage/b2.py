import os
from b2sdk.v2 import InMemoryAccountInfo, B2Api, UploadSourceLocalFile
from typing import Optional, List


def upload(file_path: str, bucket_name: str, key_id: str, app_key: str, dest_name: Optional[str] = None) -> str:
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    b2_api.authorize_account("production", key_id, app_key)
    bucket = b2_api.get_bucket_by_name(bucket_name)
    name = dest_name or os.path.basename(file_path)
    bucket.upload(UploadSourceLocalFile(file_path), name, content_type="application/x-tar")
    return f"b2://{bucket_name}/{name}"


def list_objects(bucket_name: str, key_id: str, app_key: str, prefix: str = "") -> List[dict]:
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    b2_api.authorize_account("production", key_id, app_key)
    bucket = b2_api.get_bucket_by_name(bucket_name)
    items: List[dict] = []
    for f in bucket.ls(prefix=prefix):
        items.append({"name": f.file_name, "updated_at": f.upload_timestamp})
    return items


def delete_objects(bucket_name: str, key_id: str, app_key: str, names: List[str]) -> None:
    info = InMemoryAccountInfo()
    b2_api = B2Api(info)
    b2_api.authorize_account("production", key_id, app_key)
    bucket = b2_api.get_bucket_by_name(bucket_name)
    for n in names:
        try:
            bucket.delete_file_version(n, None)
        except Exception:
            pass