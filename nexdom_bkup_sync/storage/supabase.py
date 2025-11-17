import os
from typing import Optional
from supabase import create_client
from typing import List


def upload(file_path: str, url: str, bucket: str, token: str, dest_name: Optional[str] = None) -> str:
    client = create_client(url, token)
    name = dest_name or os.path.basename(file_path)
    with open(file_path, "rb") as f:
        client.storage.from_(bucket).upload(name, f, {"content-type": "application/x-tar"})
    return f"{url}/storage/v1/object/public/{bucket}/{name}"


def list_objects(url: str, bucket: str, token: str, prefix: str) -> List[dict]:
    client = create_client(url, token)
    return client.storage.from_(bucket).list(path="", search=prefix)


def delete_objects(url: str, bucket: str, token: str, names: List[str]) -> None:
    client = create_client(url, token)
    for n in names:
        client.storage.from_(bucket).remove(n)