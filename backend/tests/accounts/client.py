from functools import partial
from typing import Any

from tests.client import TestResponse, scoped

_client = scoped("/v1")

get = _client.get
post = _client.post
patch = _client.patch
delete = _client.delete

post_account = partial(
    post, path="/accounts", data={"name": "Amazon", "type": "gift_card"}
)


def results(response: TestResponse) -> list[dict[str, Any]]:
    return response.json()["results"]


def result_ids(response: TestResponse) -> list[str]:
    return [result["id"] for result in results(response)]
