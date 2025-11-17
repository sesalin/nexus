import os
import boto3
from typing import Optional, List


def upload(file_path: str, bucket: str, access_key: str, secret_key: str, region: str = "us-east-1", dest_name: Optional[str] = None) -> str:
    name = dest_name or os.path.basename(file_path)
    s3 = boto3.client("s3", aws_access_key_id=access_key, aws_secret_access_key=secret_key, region_name=region)
    s3.upload_file(file_path, bucket, name, ExtraArgs={"ContentType": "application/x-tar"})
    return f"s3://{bucket}/{name}"


def list_objects(bucket: str, access_key: str, secret_key: str, region: str = "us-east-1", prefix: str = "") -> List[dict]:
    s3 = boto3.client("s3", aws_access_key_id=access_key, aws_secret_access_key=secret_key, region_name=region)
    paginator = s3.get_paginator("list_objects_v2")
    items: List[dict] = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        for o in page.get("Contents", []) or []:
            items.append({"name": o["Key"], "updated_at": o.get("LastModified")})
    return items


def delete_objects(bucket: str, access_key: str, secret_key: str, region: str, names: List[str]) -> None:
    if not names:
        return
    s3 = boto3.client("s3", aws_access_key_id=access_key, aws_secret_access_key=secret_key, region_name=region)
    objs = [{"Key": n} for n in names]
    s3.delete_objects(Bucket=bucket, Delete={"Objects": objs})