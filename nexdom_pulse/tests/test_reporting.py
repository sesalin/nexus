import asyncio
import json
import pytest
import responses
from haos_reporter_addon.app.main import HAOSReporter

@pytest.mark.asyncio
async def test_reporting_enabled_false(ws_test_server, supabase_mock, make_options):
    rsps, calls = supabase_mock
    def cb(request):
        calls.append(request)
        return (200, {}, json.dumps({}))
    rsps.add_callback(
        responses.POST,
        "http://test-supabase.local/rest/v1/rpc/sp_report_entity",
        callback=cb,
        content_type="application/json",
    )
    r = HAOSReporter()
    r.options_path = make_options({"reporting_enabled": False, "update_interval": 1})
    r.load_options()
    r.supervisor_token = "t"
    r.ws_url = ws_test_server
    task = asyncio.create_task(r.run())
    await asyncio.sleep(2)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert len(calls) == 0

@pytest.mark.asyncio
async def test_update_interval_flush(ws_test_server, supabase_mock, make_options):
    rsps, calls = supabase_mock
    def cb(request):
        calls.append(request)
        return (200, {}, json.dumps({}))
    rsps.add_callback(
        responses.POST,
        "http://test-supabase.local/rest/v1/rpc/sp_report_entity",
        callback=cb,
        content_type="application/json",
    )
    r = HAOSReporter()
    r.options_path = make_options({"update_interval": 1, "entities": ["sensor.temp"]})
    r.load_options()
    r.supervisor_token = "t"
    r.ws_url = ws_test_server
    task = asyncio.create_task(r.run())
    await asyncio.sleep(3)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert len(calls) >= 2

@pytest.mark.asyncio
async def test_supabase_headers_and_body(ws_test_server, supabase_mock, make_options):
    rsps, calls = supabase_mock
    def cb(request):
        assert request.headers.get("Authorization") == "Bearer test-token"
        assert request.headers.get("apikey") == "test-token"
        b = json.loads(request.body)
        assert b["p_client_id"] == "00000000-0000-0000-0000-000000000000"
        assert "p_entity" in b
        calls.append(request)
        return (200, {}, json.dumps({}))
    rsps.add_callback(
        responses.POST,
        "http://test-supabase.local/rest/v1/rpc/sp_report_entity",
        callback=cb,
        content_type="application/json",
    )
    r = HAOSReporter()
    r.options_path = make_options({"update_interval": 1, "entities": ["sensor.temp"]})
    r.load_options()
    r.supervisor_token = "t"
    r.ws_url = ws_test_server
    task = asyncio.create_task(r.run())
    await asyncio.sleep(2)
    task.cancel()
    with pytest.raises(asyncio.CancelledError):
        await task
    assert len(calls) >= 1

@pytest.mark.asyncio
async def test_http_retry_on_500(supabase_mock, make_options):
    rsps, calls = supabase_mock
    attempts = {"n": 0}
    def cb(request):
        attempts["n"] += 1
        if attempts["n"] < 3:
            return (500, {}, json.dumps({}))
        return (200, {}, json.dumps({}))
    rsps.add_callback(
        responses.POST,
        "http://test-supabase.local/rest/v1/rpc/sp_report_entity",
        callback=cb,
        content_type="application/json",
    )
    r = HAOSReporter()
    r.options_path = make_options()
    r.load_options()
    r.supervisor_token = "t"
    payload = {
        "entity_id": "sensor.temp",
        "state": "22.5",
        "attributes": {},
        "last_changed": "2025-02-02T12:30:00+00:00",
    }
    await r.post_supabase(payload)
    assert attempts["n"] >= 3