import importlib


def test_devtools_not_installed_in_production() -> None:
    production = importlib.import_module("config.settings.production")

    assert "devtools" not in production.INSTALLED_APPS
