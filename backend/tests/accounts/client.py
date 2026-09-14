from tests.client import scoped

_client = scoped("/v1")

get = _client.get
post = _client.post
patch = _client.patch
delete = _client.delete
