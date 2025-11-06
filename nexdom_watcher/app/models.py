from __future__ import annotations

from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class AddonUpdate:
    slug: str
    name: str
    version_installed: str
    version_latest: str

    @property
    def identifier(self) -> str:
        return f"addon:{self.slug}"


@dataclass(frozen=True)
class OfflineDevice:
    entity_id: str
    state: str
    friendly_name: Optional[str] = None

    @property
    def identifier(self) -> str:
        return f"entity:{self.entity_id}"
