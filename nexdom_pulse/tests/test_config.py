import os
import pytest
from haos_reporter_addon.app.main import HAOSReporter

def test_valid_config(make_options):
    os.environ["SUPERVISOR_TOKEN"] = "t"
    r = HAOSReporter()
    r.options_path = make_options()
    r.load_options()
    r.supervisor_token = "t"
    r.validate_required()

def test_missing_client_id(make_options):
    os.environ["SUPERVISOR_TOKEN"] = "t"
    r = HAOSReporter()
    r.options_path = make_options({"client_id": ""})
    r.load_options()
    r.supervisor_token = "t"
    with pytest.raises(ValueError):
        r.validate_required()

def test_missing_token(make_options):
    os.environ["SUPERVISOR_TOKEN"] = "t"
    r = HAOSReporter()
    r.options_path = make_options({"supabase_token": ""})
    r.load_options()
    r.supervisor_token = "t"
    with pytest.raises(ValueError):
        r.validate_required()

def test_missing_supervisor_token(make_options):
    r = HAOSReporter()
    r.options_path = make_options()
    r.load_options()
    r.supervisor_token = ""
    with pytest.raises(RuntimeError):
        r.validate_required()