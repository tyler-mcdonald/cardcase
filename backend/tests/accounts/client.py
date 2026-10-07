from functools import partial

from tests.client import scoped

_client = scoped("/v1")

get = _client.get
post = _client.post
patch = _client.patch
delete = _client.delete

post_account = partial(
    post,
    path="/accounts",
    data={"name": "Amazon", "type": "gift_card", "initial_balance": "0"},
)
