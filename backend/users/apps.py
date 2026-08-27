from django.apps import AppConfig


class UsersConfig(AppConfig):
    name = "users"

    def ready(self) -> None:
        # Import 'checks' here to call the 'register()' decorator in that file.
        from users import checks  # noqa: F401
