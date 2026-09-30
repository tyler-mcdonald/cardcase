from config.settings import production


def test_devtools_not_installed_in_production() -> None:
    assert "devtools" not in production.INSTALLED_APPS
