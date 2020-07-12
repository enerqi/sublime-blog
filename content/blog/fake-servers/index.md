---
title: Fake Servers
date: "2020-07-14T12:16:03.284Z"
description: Fake servers for end to end testing
---

Imagine we are thoroughly testing our web service's code for the usual reasons such as having a regression safety net,
providing executable documentation and the obvious - making sure the code correctly implements its contract, whether at
the low or high levels of the software stack.

We have dependencies on external processes such as a database and a different web service. When the database is owned
by our web service then it's relatively easy and ideal to do end to end tests with a real database instance,
preferrably the same database and version as we will use in production. Great, the software is tested very close to how
it will run in production. When we architect with a [pure core and imperative shell](/fp-architecture/) we will have
more code that is easy to test separately from the impure imperative parts, such as database calls, which will help the
tests to complete quicker as we don't need to test those pure parts heavily through the impure imperative shell -
which is often where slow downs occur.

## Testing External Services

We do not own the external service, so to some extent it's always an unknown whether making requests to it will work.
Systems do get out of sync sometimes, that's why we want observability tools like logging, tracing and metrics. The
endpoints and the data returned are the web service's contract, a contract that should be clear to users. External
services may use HTTP + REST + Json data format (e.g. [OpenAPI](https://swagger.io/specification/) and [JSON Schema](https://json-schema.org/)) or binary protocols and data formats
(e.g. [gRPC](https://grpc.io/) and [Protocol Buffers](https://developers.google.com/protocol-buffers/)). Regardless of the data format and data transport mechanism/protocols, ideally there
will never be any breaking changes to that API, but it can be easier or provide more value to just fix broken clients
instead of maintaining different API versions. [Contract Testing](https://pact.io/) tools may help ensure the
external services we are going to use are following a known contract before we get into production.

Technology organisations with a lot of resources may make it easy to test against their external service by providing

- (1) the client to call their service
- (2) a test server

The test server might be called a fake or mock server. You get to test your software stack with the real client making
a real network request. The test server may be a lightweight version of the real one or far more "fake" in that it
returns predicatable responses to requests. It may be programmable in that we can say what to return in response to
certain requests. Why not just use a real version of the server? It likely requires too much knowledge of the
implementation to setup and teardown the server for different tests (which could also be relatively slow). The server
is unlikely to provide any convenient external facing API for making tests easier - a truncate database table API is
certainly not something that we'd want to exist in production.

What if we have just (1), a client for that service? This maybe hand written by the group maintaining that
external service or it maybe generated. Either way, we don't want to be testing whether the client code itself
works. It is still useful to actually use the client against a real service to make sure we are actually using
it properly in various scenarios. When the client code is something we've produced ourselves then there's a
stronger argument for trying to use that client code in an end to end test.

## Mocking/Stubbing Client Code

In Python programs we can use the `unittest.mock` library to dynamically patch code for testing. It's easy and
very convenient in python but does couple the tests to the implementation. The coupling is because we have to
know where and how a certain module is calling the thing we want to stub. Perhaps it can be considered not too bad
if we only have one function in the project to create the client, in which case we can patch that one function to
return a stub client. On the other hand even with that single function, how to patch it depends on how that function is
imported into the module it is used.

```python
# foo.py
def make_foo_client(...):
    ...

# blah.py
def fetch_bar_from_foo_service(...):
    client = make_foo_client()
    ...

# test_blah.py
with mock.patch("foo.make_foo_client", return_value=my_stub_client):
    ...
```

The patching `"foo.make_foo_client"` has to match the module names as seen in `blah.py`. Something like [dependency
injection](https://en.wikipedia.org/wiki/Dependency_injection) is architecturally cleaner, but if the dependencies are
varied for testing purposes only then such a patch maybe an acceptable tradeoff when there is literally
one well defined function for creating the dependency.

Neither a stub via patching nor a stub injected/passed into the point of usage actually tests using the real client
code of course. We can stub a response that is always successful, but maybe our usage of the client code only works
in some of the common "happy" path cases.

## Fake Servers

So, here's where a fake server comes in. They are useful for better testing client code and should also be a
very reliable standin for the real server if implemented/maintained by the group also building the external service.
When created separately from the real external service they may suffer from not actually matching the API of the
real server, but maybe that's the best you have and you really want to test all this custom client code.

You can write a bespoke fake server or fake anything for testing. Writing a fairly large fake thing like a server
though is not something I'd want to repeat. Somethings are quite specific to you domain / application but many
services these days are fairly generic REST APIs and so we can find a reusable fake REST server.

Users of OpenAPI may consider any of these [Mock Server links](https://openapi.tools/#mock). Searching the web brings
up a lot of options to sort through. An ideal mock server should be dynamically reprogrammable, instead of requiring
config or creation of stub responses in files. Supporting more than one language or being programmable through an API
instead of the programming language library can also help.

After looking at over a dozen mock servers, two fully featured promising mock servers are
[WireMock](http://wiremock.org/) and [MockServer](https://mock-server.com/). These are both JVM applications, which
seems quite heavyweight, but if it runs over a network connection and is programmable over that network connection then
it's easy enough to containerise with Docker. I'm biased towards trying MockServer as the primary author is a former
colleague and I've touched similar mock server code a long time ago.

### py fake server

[py-fake-server](https://github.com/Telichkin/py_fake_server) is a an option for a smaller fake server that is
programmed in python 3.

```python

# conftest.py
from py_fake_server import FakeServer

@pytest.fixture
def fake_server(unused_tcp_port) -> FakeServer:
    server = FakeServer(host="localhost", port=unused_tcp_port)
    server.start()
    yield server
    server.stop()

@pytest.fixture
def fake_server_config(fake_server):
    return {
        origin: fake_server.base_uri,
        username: "test.user",
        password: "test.password"
    }

@pytest.fixture
def fake_server_client(fake_server_config):
    return MyClientImplementation(fake_server_config)
```

The test fixture may need a bit of imagination. `unused_tcp_port` is a test fixture that comes with the FakeServer
library. In this case we are starting and stopping a fake server for each test. `fake_server_client` is a helper
fixture that returns our imaginary web service client configured to point at `localhost` and the `unused_tcp_port`.

Inside a test we will setup the fake server to return certain data when a certain endpoint is called:

```python

def test_something(fake_server, fake_server_client):
    fake_server.on_("get", "/foo/bar?x=y").response(
        status=200, body="...", content_type="application/json"
    )

    fake_server_client.do_call(...)
```

Overall this was fairly easy to do. The request to response matching is very specific though and making a request
match a response was a bit fiddly when it came to quoting/unquoting url strings with query parameters. An obvious
limitation of this smaller fake server is that the body content is not considered in the request response matching.
Hence, I'll give MockServer further analysis at some point.

A fake server can also reply with rare error paths to test your client's handling of error in networking. For
performance testing it could be used to isolate some external service and have it respond with various latencies all
whilst not requiring the resources of real running external server. Finally, a mock server can help if the real
external service does not yet exist, but some specification for it does.
