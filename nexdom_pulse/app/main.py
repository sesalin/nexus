import os
import json
import asyncio
import logging
import time
from fnmatch import fnmatch
from typing import Dict, Any, List
import websockets
import requests
import contextlib

class HAOSReporter:
    def __init__(self):
        self.options_path = "/data/options.json"
        self.options: Dict[str, Any] = {}
        self.client_id = ""
        self.supabase_url = ""
        self.supabase_token = ""
        self.update_interval = 60
        self.entities_patterns: List[str] = ["*"]
        self.client_name = ""
        self.reporting_enabled = True
        self.log_level = "info"
        self.ws_url = "ws://supervisor/core/websocket"
        self.supervisor_token = ""
        self.id_counter = 1
        self.changed_buffer: Dict[str, Dict[str, Any]] = {}
        self.connected_once = False

    def load_options(self):
        with open(self.options_path, "r", encoding="utf-8") as f:
            self.options = json.load(f)
        self.client_id = self.options.get("client_id", "")
        self.supabase_url = self.options.get("supabase_url", "")
        self.supabase_token = self.options.get("supabase_token", "")
        self.update_interval = int(self.options.get("update_interval", 60))
        self.entities_patterns = self.options.get("entities", ["*"])
        self.client_name = self.options.get("client_name", "")
        self.reporting_enabled = bool(self.options.get("reporting_enabled", True))
        self.log_level = self.options.get("log_level", "info").lower()

    def setup_logging(self):
        level = {
            "debug": logging.DEBUG,
            "info": logging.INFO,
            "warning": logging.WARNING,
            "error": logging.ERROR,
        }.get(self.log_level, logging.INFO)
        logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(message)s")

    def load_supervisor_token(self):
        """Return the Supervisor token from env var or fallback file."""
        token = os.environ.get("SUPERVISOR_TOKEN")
        if token:
            return token.strip()
        candidate_files: List[str] = []
        token_file = os.environ.get("SUPERVISOR_TOKEN_FILE")
        if token_file:
            candidate_files.append(token_file)
        # Standard HassOS path exposed to add-ons
        candidate_files.append("/run/secrets/supervisor_token")
        candidate_files.append("/data/supervisor_token")
        for path in candidate_files:
            if not path or not os.path.exists(path):
                continue
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = f.read().strip()
                    if data:
                        return data
            except OSError as exc:
                logging.warning("No se pudo leer token del archivo %s: %s", path, exc)
        return ""

    def validate_required(self):
        required = [self.client_id, self.supabase_url, self.supabase_token, self.update_interval, self.entities_patterns]
        if not all(required):
            raise ValueError("Opciones obligatorias faltantes")
        if not self.supervisor_token:
            raise RuntimeError("SUPERVISOR_TOKEN no disponible")

    def next_id(self):
        i = self.id_counter
        self.id_counter += 1
        return i

    def matches(self, entity_id: str) -> bool:
        for p in self.entities_patterns:
            if p == "*":
                return True
            if "*" in p:
                if fnmatch(entity_id, p):
                    return True
            else:
                if entity_id == p:
                    return True
        return False

    def build_payload(self, state: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "entity_id": state.get("entity_id"),
            "state": state.get("state"),
            "attributes": state.get("attributes", {}),
            "last_changed": state.get("last_changed"),
        }

    async def post_supabase(self, payload: Dict[str, Any]):
        url = f"{self.supabase_url}/rest/v1/rpc/sp_report_entity"
        body = {"p_client_id": self.client_id, "p_entity": payload}
        headers = {
            "Authorization": f"Bearer {self.supabase_token}",
            "apikey": self.supabase_token,
            "Content-Type": "application/json",
        }
        attempt = 1
        while True:
            def do_post():
                return requests.post(url, headers=headers, json=body, timeout=15)
            resp = await asyncio.to_thread(do_post)
            if resp.status_code < 300:
                logging.debug("Supabase ok %s", resp.status_code)
                return
            logging.error("Supabase error %s %s", resp.status_code, resp.text)
            if attempt >= 3:
                return
            delay = min(2 ** (attempt - 1), 10)
            attempt += 1
            await asyncio.sleep(delay)

    async def auth(self, ws):
        msg = await ws.recv()
        data = json.loads(msg)
        if data.get("type") != "auth_required":
            raise RuntimeError("WebSocket auth_required no recibido")
        await ws.send(json.dumps({"type": "auth", "access_token": self.supervisor_token}))
        msg = await ws.recv()
        data = json.loads(msg)
        if data.get("type") != "auth_ok":
            raise RuntimeError("WebSocket auth fallida")

    async def request_get_states(self, ws):
        req_id = self.next_id()
        await ws.send(json.dumps({"id": req_id, "type": "get_states"}))
        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            if data.get("id") == req_id and data.get("type") == "result":
                if data.get("success"):
                    return data.get("result", [])
                else:
                    raise RuntimeError("get_states sin éxito")

    async def subscribe_state_changed(self, ws):
        req_id = self.next_id()
        await ws.send(json.dumps({"id": req_id, "type": "subscribe_events", "event_type": "state_changed"}))
        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            if data.get("id") == req_id and data.get("type") == "result":
                if data.get("success"):
                    return
                else:
                    raise RuntimeError("subscribe_events sin éxito")

    async def receiver(self, ws):
        while True:
            msg = await ws.recv()
            data = json.loads(msg)
            if data.get("type") == "event":
                ev = data.get("event", {})
                et = ev.get("event_type")
                if et == "state_changed":
                    new_state = ev.get("data", {}).get("new_state")
                    if new_state:
                        entity_id = new_state.get("entity_id")
                        if entity_id and self.matches(entity_id):
                            payload = self.build_payload(new_state)
                            self.changed_buffer[entity_id] = payload

    async def flush_buffer(self):
        if not self.reporting_enabled:
            self.changed_buffer.clear()
            return
        items = list(self.changed_buffer.items())
        for _, payload in items:
            try:
                await self.post_supabase(payload)
            except Exception as e:
                logging.error("Error enviando a Supabase: %s", e)
        self.changed_buffer.clear()

    async def run(self):
        self.load_options()
        self.setup_logging()
        self.supervisor_token = self.load_supervisor_token()
        self.validate_required()
        backoff = 1
        while True:
            try:
                async with websockets.connect(self.ws_url, ping_interval=30, ping_timeout=20) as ws:
                    await self.auth(ws)
                    states = await self.request_get_states(ws)
                    if self.reporting_enabled:
                        for s in states:
                            eid = s.get("entity_id")
                            if eid and self.matches(eid):
                                payload = self.build_payload(s)
                                await self.post_supabase(payload)
                    await self.subscribe_state_changed(ws)
                    self.connected_once = True
                    backoff = 1
                    flush_task = asyncio.create_task(self.periodic_flush())
                    try:
                        await self.receiver(ws)
                    finally:
                        flush_task.cancel()
                        with contextlib.suppress(Exception):
                            await flush_task
            except Exception as e:
                logging.error("Desconectado del WebSocket: %s", e)
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 60)

    async def periodic_flush(self):
        while True:
            await asyncio.sleep(self.update_interval)
            await self.flush_buffer()

if __name__ == "__main__":
    reporter = HAOSReporter()
    asyncio.run(reporter.run())
