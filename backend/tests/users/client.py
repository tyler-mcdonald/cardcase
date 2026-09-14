from tests.client import BROWSER_CLIENT_BASE, scoped

_client = scoped(BROWSER_CLIENT_BASE)

get = _client.get
post = _client.post
patch = _client.patch
delete = _client.delete
