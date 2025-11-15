from haos_reporter_addon.app.main import HAOSReporter

def test_filter_wildcards(make_options):
    r = HAOSReporter()
    r.options_path = make_options({"entities": ["*"]})
    r.load_options()
    assert r.matches("sensor.x")
    assert r.matches("light.sala")

def test_filter_prefix(make_options):
    r = HAOSReporter()
    r.options_path = make_options({"entities": ["sensor.*"]})
    r.load_options()
    assert r.matches("sensor.temp")
    assert not r.matches("light.sala")

def test_filter_exact(make_options):
    r = HAOSReporter()
    r.options_path = make_options({"entities": ["light.sala"]})
    r.load_options()
    assert r.matches("light.sala")
    assert not r.matches("light.cocina")