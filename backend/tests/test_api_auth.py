from collections.abc import Iterator, Sequence
from typing import Any
from uuid import uuid4

import pytest
from django.test import Client
from django.urls import URLPattern, URLResolver, get_resolver, reverse
from rest_framework.exceptions import NotAuthenticated

API_PREFIX = "v1/"
UNTESTED_METHODS = {"head", "options"}


def _walk(
    patterns: Sequence[URLPattern | URLResolver], prefix: str = ""
) -> Iterator[tuple[str, URLPattern]]:
    for pattern in patterns:
        if isinstance(pattern, URLResolver):
            yield from _walk(pattern.url_patterns, prefix + str(pattern.pattern))
        else:
            yield prefix + str(pattern.pattern), pattern


def _allowed_methods(view: Any) -> list[str]:
    allowed = view.cls.http_method_names
    actions = getattr(view, "actions", None)
    handled = (
        actions.keys() if actions else [m for m in allowed if hasattr(view.cls, m)]
    )
    return [m for m in handled if m in allowed and m not in UNTESTED_METHODS]


def _path(pattern: URLPattern) -> str:
    assert pattern.name, f"API route {pattern.pattern} needs a name"
    params = {param: str(uuid4()) for param in pattern.pattern.regex.groupindex}
    return reverse(pattern.name, kwargs=params)


def _api_requests() -> list[Any]:
    return [
        pytest.param(method, pattern, id=f"{method.upper()} /{route}")
        for route, pattern in _walk(get_resolver().url_patterns)
        if route.startswith(API_PREFIX)
        for method in _allowed_methods(pattern.callback)
    ]


API_REQUESTS = _api_requests()


def test_api_routes_are_discovered() -> None:
    assert API_REQUESTS


@pytest.mark.django_db
@pytest.mark.parametrize(("method", "pattern"), API_REQUESTS)
def test_api_requires_authentication(
    client: Client, method: str, pattern: URLPattern
) -> None:
    response = client.generic(method.upper(), _path(pattern))

    assert response.status_code == 403
    assert response.json()["detail"] == NotAuthenticated.default_detail
