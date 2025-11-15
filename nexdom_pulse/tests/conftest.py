import asyncio
import json
import os
import pytest
import websockets
from websockets.server import serve
import responses
import sys
import pathlib
import pytest_asyncio

sys.path.append(str(pathlib.Path(__file__).resolve().parents[2]))

from haos_reporter_addon.app.main import HAOSReporter

@pytest.fixture
def make_options(tmp_path):
    def _make(overrides=None):
        base = {
            "client_id": "00000000-0000-0000-0000-000000000000",
            "supabase_url": "http://test-supabase.local",
            "supabase_token": "test-token",
            "update_interval": 2,
            "entities": ["*"],
            "client_name": "Test",
            "reporting_enabled": True,
            "log_level": "debug",
        }
        if overrides:
            base.update(overrides)
        p = tmp_path / "options.json"
        p.write_text(json.dumps(base), encoding="utf-8")
        return str(p)
    return _make

@pytest.fixture
def reporter(make_options):
    os.environ["SUPERVISOR_TOKEN"] = "token"
    r = HAOSReporter()
    r.options_path = make_options()
    r.load_options()
    r.supervisor_token = "token"
    return r

@pytest.fixture
def supabase_mock():
    calls = []
    rsps = responses.RequestsMock(assert_all_requests_are_fired=False)
    rsps.start()
    yield rsps, calls
    rsps.stop()
    rsps.reset()

async def ws_handler(websocket):
    await websocket.send(json.dumps({"type": "auth_required"}))
    msg = await websocket.recv()
    data = json.loads(msg)
    await websocket.send(json.dumps({"type": "auth_ok"}))
    while True:
        msg = await websocket.recv()
        data = json.loads(msg)
        if data.get("type") == "get_states":
            result = [
                {
                    "entity_id": "sensor.temp",
                    "state": "22.5",
                    "attributes": {"unit_of_measurement": "°C"},
                    "last_changed": "2025-02-02T12:30:00+00:00",
                },
                {
                    "entity_id": "light.sala",
                    "state": "on",
                    "attributes": {},
                    "last_changed": "2025-02-02T12:30:00+00:00",
                },
            ]
            await websocket.send(json.dumps({"id": data.get("id"), "type": "result", "success": True, "result": result}))
        elif data.get("type") == "subscribe_events" and data.get("event_type") == "state_changed":
            await websocket.send(json.dumps({"id": data.get("id"), "type": "result", "success": True}))
            await websocket.send(json.dumps({
                "type": "event",
                "event": {
                    "event_type": "state_changed",
                    "data": {
                        "new_state": {
                            "entity_id": "sensor.temp",
                            "state": "23.0",
                            "attributes": {"unit_of_measurement": "°C"},
                            "last_changed": "2025-02-02T12:31:00+00:00",
                        }
                    }
                }
            }))

@pytest_asyncio.fixture
async def ws_test_server(unused_tcp_port):
    port = unused_tcp_port
    srv = await serve(ws_handler, "127.0.0.1", port)
    yield f"ws://127.0.0.1:{port}/"
    srv.close()
    await srv.wait_closed()
@pytest.fixture
def unused_tcp_port():
    import socket
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port