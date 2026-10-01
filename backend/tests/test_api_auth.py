from collections.abc import Iterator, Sequence
from typing import Any
from uuid import uuid4

import pytest
from django.test import Client
from django.urls import URLPattern, URLResolver, get_resolver, resolve, reverse
from rest_framework.exceptions import NotAuthenticated

API_PREFIX = "v1/"


def _flatten_url_patterns(
    patterns: Sequence[URLPattern | URLResolver], prefix: str = "", namespace: str = ""
) -> Iterator[tuple[str, str, URLPattern]]:
    for pattern in patterns:
        if isinstance(pattern, URLResolver):
            yield from _flatten_url_patterns(
                pattern.url_patterns,
                prefix + str(pattern.pattern),
                f"{namespace}{pattern.namespace}:" if pattern.namespace else namespace,
            )
        else:
            yield prefix + str(pattern.pattern), namespace, pattern


def _handled_methods(view: Any, view_class: Any) -> list[str]:
    actions = getattr(view, "actions", None)
    if actions:
        return list(actions.keys())
    return [m for m in view_class.http_method_names if hasattr(view_class, m)]


def _allowed_methods(route: str, view: Any) -> list[str]:
    view_class = getattr(view, "cls", None)
    assert view_class, f"API route {route} must be a DRF view"
    handled = _handled_methods(view, view_class)
    if "get" in handled:
        handled.append("head")
    handled.append("options")
    return [m for m in view_class.http_method_names if m in handled]


def _path(namespace: str, pattern: URLPattern) -> str:
    assert pattern.name, f"API route {pattern.pattern} needs a name"
    params = {param: str(uuid4()) for param in pattern.pattern.regex.groupindex}
    path = reverse(namespace + pattern.name, kwargs=params)
    assert resolve(path).func is pattern.callback, (
        f"API route name {namespace + pattern.name} is not unique"
    )
    return path


def _api_requests() -> list[Any]:
    return [
        pytest.param(method, namespace, pattern, id=f"{method.upper()} /{route}")
        for route, namespace, pattern in _flatten_url_patterns(get_resolver().url_patterns)
        if route.startswith(API_PREFIX)
        for method in _allowed_methods(route, pattern.callback)
    ]


API_REQUESTS = _api_requests()


def test_api_routes_are_discovered() -> None:
    assert API_REQUESTS


@pytest.mark.django_db
@pytest.mark.parametrize(("method", "namespace", "pattern"), API_REQUESTS)
def test_api_requires_authentication(
    client: Client, method: str, namespace: str, pattern: URLPattern
) -> None:
    response = client.generic(method.upper(), _path(namespace, pattern))

    assert response.status_code == 403
    if method != "head":
        assert response.json()["detail"] == NotAuthenticated.default_detail
