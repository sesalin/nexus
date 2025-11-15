from haos_reporter_addon.app.main import HAOSReporter

def test_logging_levels(make_options):
    for lvl in ["debug", "info", "warning", "error"]:
        r = HAOSReporter()
        r.options_path = make_options({"log_level": lvl})
        r.load_options()
        r.setup_logging()