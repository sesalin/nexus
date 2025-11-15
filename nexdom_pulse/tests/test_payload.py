from haos_reporter_addon.app.main import HAOSReporter

def test_payload_structure(make_options):
    r = HAOSReporter()
    r.options_path = make_options()
    r.load_options()
    state = {
        "entity_id": "sensor.temperature_sala",
        "state": "22.5",
        "attributes": {"unit_of_measurement": "°C"},
        "last_changed": "2025-02-02T12:30:00+00:00",
    }
    p = r.build_payload(state)
    assert p["entity_id"] == "sensor.temperature_sala"
    assert p["state"] == "22.5"
    assert p["attributes"]["unit_of_measurement"] == "°C"
    assert p["last_changed"]