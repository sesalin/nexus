from __future__ import annotations

import logging
from typing import Dict, Iterable, Set


class StateTracker:
    """Mantiene el estado actual de alertas activas para detectar altas/bajas."""

    def __init__(self, name: str) -> None:
        self._active: Set[str] = set()
        self._name = name
        self._logger = logging.getLogger(f"state.{name}")

    def diff(self, current: Iterable[str]) -> tuple[Set[str], Set[str]]:
        current_set = set(current)
        new_items = current_set - self._active
        resolved_items = self._active - current_set
        self._active = current_set
        self._logger.debug(
            "Tracker %s | activos=%d nuevos=%d resueltos=%d",
            self._name,
            len(self._active),
            len(new_items),
            len(resolved_items),
        )
        return new_items, resolved_items

    def mark_active(self, identifier: str) -> None:
        self._active.add(identifier)

    def mark_resolved(self, identifier: str) -> None:
        self._active.discard(identifier)

    @property
    def active(self) -> Set[str]:
        return set(self._active)
