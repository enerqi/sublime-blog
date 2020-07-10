---
title: Error Handling
date: "2020-05-13T19:45:03.284Z"
description: "Using predominantly pure error handling"
---

At this point there are two main systems for handling errors in programming languages. Throwing exceptions or returning values. I strongly prefer returning values - more pure functional being just one reason why, however I
accept that exceptions do have their place, which makes this harder to discuss as there are various factors to consider.

C programming often includes mutating input parameters to functions instead of returning
a value (side effecting changes), using the return value as an error code or even setting a global
error value (e.g. `errno` - it can be threadlocal but the data has to be accessed through a non-local variable).
Whilst there are plenty of imperative languages with impure functions/methods that mutate input
parameters, global error values or error code returns are considered bad style in high level languages. Even if thread safe you may not even be aware that the API sets a global error and having the return value be an
error code has poor aesthetics if we want to do things like chain function calls.

The return value can be a composite of the success path and the failure path. In Go lang programming this means a
tuple `(value, error)` where if `error` is not `nil` then the error case occurred, otherwise the success `value` is the
success case (presumably `nil` if not successful).

```go
response, err := doApiCall("...")
if err != nil {
    // handle the error, commonly just:
    return err
}
// do something with response
```

This style does make the error handling upfront/explicit as the
caller has to receive the error value. However, the type system and compiler won't force you to correctly check
whether you got an error value or not.

## Typed Return Values

The return value can be better typed, e.g. a `Result` (or `Either` in some other languages) type encapsulates a success
value or error value with both types tracked by the type system. A [result library](https://pypi.org/project/result/) even exists in python and makes full use of type annotations meaning it works well with the `mypy` python typechecking tool. Results are commonly used in typed functional languages (F#, Ocaml, Haskell, Elm etc.) and Rust.


```python
from enum import Enum, auto
from typing import NewType

UserId = NewType("UserId", int)

class ApiCallError(Enum):
    NotFound = auto()
    ServerError = auto()

def do_api_call() -> Result[UserId, ApiCallError]:
    ...
    return Result.Ok(UserId(42))
```

The result can be queried with `is_ok` or `is_err` and then the value pulled out. In a strongly typed language it
would be a compile error to try and pull the success case out when the error case occurred. The type signature makes
it clear that this function returns one of `UserId` or `ApiCallError` and it can be a pure function with the usual
benefits.


### Results, the uglier parts

When calling third party impure code that does throw exceptions we can catch unexpected exceptions, perhaps log the
error in application code, and return a typed result (or even an Optional if not providing error
information). That is fine. When we do want to provide detailed error information we may end up wrapping the exception
that we just caught.

```python
from adt import adt, Case

@adt
class ApiCallErrorADT:
    NOT_FOUND: Case[str]
    SERVER_ERROR: Case[Exception]

def do_api_call() -> Result[UserId, ApiCallErrorADT]:
    try:
        ...
        return Result.Ok(UserId(...))
    except Exception as e:
        ...
        return Result.Err(ApiCallErrorADT.SERVER_ERROR(e))
```

Here, the adt library is used so that we can associate data with a union case - python doesn't natively support
discriminated/disjoint unions - we can't have variable data when just using an Enum. Any wrapping/unwrapping is a
bit tedious though. Better typed, but may seem like extra work when you already had an Exception instance, a type
designed to contain errors. Exceptions can also have subclasses, e.g. we could have a `ServerError` exception, why is
that not a good enough return type - `Result[UserId, ServerError]`? Actually, it is fine when there is only one type
of error to deal with. We are returning success or an exception instead of returning success or *throwing* an exception.

It's fine if this looks a bit weird, python hasn't long had tools for using Results and Types rigorously. Naturally,
it's not as robust as a full statically compiled language. In this example, why not just use an exception hierarchy
and return (not throw)
e.g. an `ApiException` that has subclasses like `NotFound` or `GenericServerError`? That's more a discussion around
designing with types - do you want an open extensible list of error cases or a closed documented explicit list of all
the error cases in one place? I'd default to a closed concrete definition, particularly useful for differentiating domain errors to branch on in a strongly typed way. It's also worth mentioning that python does
not have pattern matching, the `mypy` type checker does not currently ensure that you handle every case of an enum.
The `adt` decorator does generate a `match` method on the class it decorates:

```python
api_call_error.match(
    not_found=lambda not_found_message: ...,
    server_error=lambda server_error_exception: ...
)
```

Works, though a bit different to first class `match` expressions in languages actually supporting pattern matching.
Syntactic verbosity was present in querying the result `is_ok` or `is_err` and then pulling out the value.
Languages with strong adt (algebraic data type - specifically disjoint unions) support have ways to make (monadic)
error handling much terser, e.g. the `?` operator in Rust.

## Exceptions

Exceptions are the default in mainstream Object Oriented languages, including in Python. Two big problems with
exceptions are the lack of proper typing and the complete violation of functional purity.

Functional first design assumes we are striving for functional purity. Even an almost total pure function that
has a deterministic output for every input except one that throws an exception is impure. It's not referentially
transparent but rather dependent upon what code if any handles the exception further up the call stack. The unwinding
of the stack frame will wreck any other parent functions that try to be pure or just complete their operations.

The lack of proper typing, assuming we actually appreciate static typing as a tool for modelling and constraining the
inputs and outputs to functions, is a barrier to understanding. No longer does the function just return what it says
it does in the return type signature but some number of exceptions could be thrown which may only be apparent by reading
the documentation or the source code. Often it will be insufficient to look at just the source code of that one
function but all the functions that are called from that point must be understood. Checked exceptions in Java are the
only typed-in-signature exceptions in a mainstream OO language (ignoring the the little used `throw` annotations in C++ libraries).
It can be interesting to know why they are really not popular in Java though - see [The Problem With Checked Exceptions](http://wiki.c2.com/?TheProblemWithCheckedExceptions).

### Exceptions, the good parts

Exceptions do encapsulate a lot of often useful error information in the form of a stack trace (trace back). The
trace back is conveniently created and shown without effort on the programmers part when unhandled or explicitly
printed. Domain error creation utility libraries in Rust language programming can provide this, but it's not as
immediate (note Rust has no exceptions).

For prototyping it is convenient to just fail fast instead of caring about describing all possible error paths with domain
error types. Failing fast makes sense at other times, such as truly exceptional code paths, e.g. invalid configuration
on application startup or the program getting into a state that it is unable to recover from.

For libraries, I argue that it's more important to use return values - libraries should be clear about their errors
in the type signatures so different applications can handle the errors as is suitable for them, which could then
include throwing an exception. The big question though is whether in a language throwing exceptions it's worth it to
wrap that exception in a domain error. A lot of the time that exception will have nothing to do with your domain and
there is nothing that can be done with it except pass it on in a wrapping type.

## Overall

I'd throw an exception or let exceptions be propagated if the event is *actually "exceptional"* enough that we can't do anything useful with it (or if it is an error pertinent to our application domain then we have actively choosen to ignore it for now). Things we can't do much about generally cover the operating environment. What is or is not part of
our domain of concerns may need adjusting if exceptions come up that we can reasonably squash into a domain error.
Actually doing something useful with uncaught exceptions should be fairly trivial to setup once. In a web service the
framework should be catching and logging the exception, and returning an appropriate 500 server error.
In an actor based system with supervisor hierarchies like [Erlang OTP](https://www.erlang.org/) or [Akka](https://akka.io/) exceptional events would cause the crashed processes to be restarted anew.

When letting exceptons happen deliberately it maybe useful to document what raised exceptions are
being allowed as opposed to just not known about. A final case where using a exception for brevity could be appropriate
is when the exception is defined, thrown and caught within the scope of one module's private functions and documented
to do so - local control flow, the more local the better. It will however, not be documented by the type system and be
messier to test. Exceptions shouldn't flow across two different *public* functions.

When using results and typed errors separating out and modelling all your domain errors can make domain decison logic
clearer (especially if the domain errors are a concrete closed disjoint union), but exceptions coming from third party
libraries or generic operating environment errors will be handled by (1) wrapping it, (2) letting it throw or (3)
translating it to a domain error. On balance (1) may have little value so we are left with letting it throw which
includes all the details from the error source or finding a sensible domain error which will probably squash some of
the error detail. When (3) is reasonable, go for it, and when it's not, let it throw and try not to depend on
information in the exception as the exception hierarchy is open - it would be hard to reason about what can and should
be handled from what exceptions where.
