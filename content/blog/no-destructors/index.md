---
title: Resource Management in Python
date: "2020-05-22T19:45:03.284Z"
description: Context manager for resources
---

C++ has the concept of destructors. A dual of the constructor that runs when the class object goes out of scope. They
are often used as part of the [RAII](https://en.wikipedia.org/wiki/Resource_acquisition_is_initialization) idiom to
do resource management - releasing the resource the moment the object is destroyed so that there are no resource leaks.
In C++ it's clear when an object goes out of scope and when the destructor will be called. Ok, smart pointers and heap
allocation make it less clear and smart pointer reference cycles can be a problem, but let's simplify.

Java and C# have `finalize` methods on the top level object class and all python objects have a `__del__` method that
can be customised. This looks a reasonable way to manage a resource:

```python
class DbConnection:
    def __init__(self):
        self.connection = ... # make a connection

    def __del__(self):
        self.close()

    def close(self):
        ... # close the connection
        self.connection = None

dbconn = DbConnection()
```

We can create a `DbConnection` and close it manually with the `close` method. We can also let the object go out of
scope. The `__del__` method ensures that the connection is closed when the object is about to be destroyed. Sounds
convenient. Unfortunately, this is not timely resource management. Unless we manually trigger the garbage collector (GC) we have no idea when the GC will clean up unused objects and actually destroy them, which is when `__del__` is
actually called. The connection maybe held open for a long time if there is not much memory pressure on the GC which
in turn may stop other modules proceeding that need a connection when the number of connections is limited.

On a side note `del dbconn` doesn't call the `__del__` method. It just unbinds the reference from the connection, so
that if and only if there are no more references to that instance of `DbConnection` the GC can reclaim it when it does
finally run.

The way to manage invidual resources in python is normally with a context manager. We can manually call `close()`
when relevant but to be safe we'd have to make it exception safe:

```python
dbconn = DbConnection()
try:
    dbconn.do_something()
finally
    dbconn.close()
```

Fine, but gets a bit syntactically verbose and tedious. We could make the `DbConnection` a context manager by adding
`__enter__` and `__exit__` methods to the object and then write:

```python
with DbConnection() as dbconn:
    ... # do stuff
```

The dbconn will close when the with block goes out of scope. In this case the object has a `close` method so we can
use `contextlib` instead of adding methods to the `DbConnection`:

```python
from contextlib import closing

with closing(DbConnection()) as dbconn:
    ... # do stuff
```

If we don't have a `close` method and don't have enter/exit methods we can use the contextmanager decorator that
yields a resource and performs clean up after the yield. It does need the exception handling put in to be safe.


```python
from contextlib import contextmanager

@contextmanager
def scoped_dbconn():
    conn = DbConnection()
    try:
        yield conn
    finally:
        # clean up conn

with scoped_dbconn() as dbconn:
    ... # do stuff
```

This approach to resource management is seen in other garbage collected languages. In .NET languages (C#/F#) there is
a `using` statement which is equivalent to `with` in python. Java 7 introduced "try-with-resources" as its equivalent.
Javascript/Typescript don't seem to have any such thing built-in. The `with` statement is totally different.
