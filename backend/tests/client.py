import json

BROWSER_CLIENT_BASE = "/_allauth/browser/v1"


def get(client, path):
    return client.get(f"{BROWSER_CLIENT_BASE}{path}")


def csrf_token(client):
    if "csrftoken" not in client.cookies:
        get(client, "/auth/session")
    return client.cookies["csrftoken"].value


def post(client, path, data):
    return client.post(
        f"{BROWSER_CLIENT_BASE}{path}",
        data=json.dumps(data),
        content_type="application/json",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def delete(client, path):
    return client.delete(
        f"{BROWSER_CLIENT_BASE}{path}",
        HTTP_X_CSRFTOKEN=csrf_token(client),
    )


def get_session(client):
    return get(client, "/auth/session")
