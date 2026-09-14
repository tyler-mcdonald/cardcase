from tests.client import AUTH_BASE, scoped

_client = scoped(AUTH_BASE)

get = _client.get
post = _client.post
patch = _client.patch
delete = _client.delete
