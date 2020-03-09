---
title: High Level FP Architecture
date: "2020-03-07T19:45:03.284Z"
description: "Designing around pure functions for the whole program"
---

In a [previous post](/fp-first) I argued for preferring the functional paradigm when programming because pure functions are easier
to understand and help produce more correct code within larger code bases with less mental overhead. What does an FP
first application look like - an application that trys to use more pure functions? When not using methods on objects,
all functionality, pure or impure, is actually built using only functions. In that situation, we could count all
functions in the project and build a metric around whether they are pure or impure - 59 pure, 22 impure etc. We could
also take a count of pure vs impure lines of code. Either way we'd have a rough idea about how successful we have been
at making the codebase pure. So, how do we improve this or similar metrics?

Impure functions can call pure functions or call other impure functions. They remain impure regardless of any pure
functions called.

```python

def add(x, y): return x + y
def sub(x, y): return x - y

def foo(x):
  a = add(x, x)
  global multiplicand
  return sub(a, x*multiplicand)
```

Here `foo` is impure because it references global data. We could also make it impure by printing. The trivial `add`
and `sub` functions are pure. It doesn't matter how many pure functions `foo` calls though, the moment it does something impure it is forever impure. Pure functions can only call pure functions otherwise they become impure.

Programs that have zero side-effects, that is, they only have pure functions are useless. State and side-effects are
required for a computer to be useful. Even a program that is one giant pure function composed of other functions needs
to use side-effects to read inputs to the program and write/display/communicate the results somehow. So, we know that
both pure and impure functions are required and pure functions are their own islands that can only use other pure
functions.

The function call flow of the program can be visualised as a graph. The program call stack is a reflection of that.
If `foo` is called by `main` (or `__main__` in python) this small graph as the program advances is:

```
1) main
2) main -> foo
3) main -> foo -> add
4) main -> foo -> sub
5) main -> foo
6) main
```

At points (3) and (4) we are using pure functions, everything else is impure. The entry point to the program will
always be impure. It is realistic to expect other impure functions to exist in main that communicates the results of
an otherwise pure program:

```
- main
- main -> pure_calculation
- main -> log_results
- main
```

When using a web framework with API endpoints there's likely a large number of impure functions behind your endpoint,
not just a single `main` function. The impure context is larger.

```
main -> framework ... -> endpoint_entry ...
```

The `endpoint_entry` maybe complicated but its implementation (ideally) is not your concern, it's a tool to use. To
maximise purity we try to put as many pure functions as high up in the call stack as possible.


```
- main
- main -> pure_calculation_1 (-> pure_calculation_implementation_1...)
- main -> pure_calculation_2 (-> pure_calculation_implementation_2...)
- main -> pure_calculation_3 (-> pure_calculation_implementation_3...)
- main -> log_results
- main
```

is better than

```
- main
- main -> pure_calculation_1 (-> pure_calculation_implementation_1...)
- main -> impure_2 (-> pure_2)
- main -> impure_3 (-> pure_3)
- main -> log_results
- main
```

The hope is that `pure_calculation_implementation_n` constitutes a lot of the program. In the second program we prefer
that `impure_2` and `impure_3` mostly limit themselves to work around communicating the results of the program, not the
core logic. The impure functions may also, like the toy `foo` function, be providing some re-usable functionality that
packages pure functions in an impure context.

In a simple program the ideal structure will be:

```
- main
- main -> impure_read_inputs
- main -> pure_calculation
- main -> impure_log_results
- main
```

The `pure_calculation` could be significant - single pass compilers (albeit likely toy) compilers could be implemented
as a pure function over input passed via `stdin` to `main`.

## Common Web Service Endpoint

Even a small web service will likely involve some sort of read and or write to a data persistence layer (i.e. database),
possibly many.

```
- endpoint_entry
- endpoint_entry -> pure_read_inputs
- endpoint_entry -> pure_validate_inputs
- endpoint_entry -> pure_build_input_domain_types
- endpoint_entry -> impure_database_read
- endpoint_entry -> pure_validate_database_read
- endpoint_entry -> pure_build_domain_types_from_database
- endpoint_entry -> pure_calculations
- endpoint_entry -> impure_database_write
- endpoint_entry -> pure_calculate_api_response_types
- endpoint_entry -> pure_serialise_api_response_types
- endpoint_entry (impure_return_serialised_response_to_framework)
```

`pure_read_inputs` may involve impurity if the request is not all in memory yet, otherwise the inputs are just there
for you. The web framework may have validated some properties of the inputs for you, but it is likely that some
validation `pure_validate_inputs` is required. This is often combined with making your actual domain types
`pure_build_input_domain_types`.

So far no side effects are required, except maybe logging, which as I've argued before, you could treat as an exception
to the definition of purity. To do one or more calculation(s) we often need to read a database `impure_database_read`.
For convenience you might chain `pure_build_domain_types_from_database` + `pure_validate_database_read` and the actual
`impure_database_read`. The utility function that chains these together itself is impure, but should be easy to test
and understand if it only chains them instead of doing any interesting logic, at worst bailing out of the chain early
if there is an error:

```
utility -> impure_database_read
utility -> pure_validate_database_read
utility -> pure_build_domain_types_from_database
```

We could keep this `utility` composition function pure by making the `impure_database_read` yield (literally `yield` in
python) the intent to read from the database and writing an impure interpreter to execute the side effect(s). The
FP interpreter pattern (a.k.a Free Monad) is something I want to cover at a later date in the context of
injecting dependencies.

The `impure_database_write` is much the same as the read except we are feeding data in and probably don't have any data that comes
back - if following CQRS (command query v.s. responsibility segregation). After that `pure_calculate_api_response_types`
and `pure_serialise_api_response_types` are more pure functions that separates the domain types from the api response
types. When finally given back to the web framework, by function return, the framework takes over the job of doing
all the impure network actions, handling threads and new requests.

## Small Scale Design

At the small scale, e.g. a module of functions, I hesitate to use the word architecture. Patterns are also a higher
abstraction, and yes, FP has patterns much like e.g. OO programming does. Many of the original [Design Patterns](https://en.wikipedia.org/wiki/Design_Patterns) were documented in an OO context and have easy solutions in FP such
that they are not really talked about or described as patterns, just features of the language. Many of the original
[design patterns in dynamic languages](https://norvig.com/design-patterns/) such as Python are also mostly irrelevant.
Except maybe as some form of agreed terminology. FYI the book "Head First Design Patterns" seems to be the preferred modern book for those OO design patterns whilst the Enterprise Patterns books by Martin Fowler have been popular
for OO large scale design. Some things in imperative programming such as state mutation are easy, but unless you
allow local mutation in your FP program and can keep the mutation local to a function, then you may need something
like the State monad (an FP pattern).

The small scale design is more about techniques. One technique is *immutable data* - local data aswell as function inputs. To "change" the local data we need to be able to opt in to mutation, e.g. with the `mutable` keyword in F# or
we need to use *recursion*. So, we don't have a stack overflow when recursing, FP languages often support
*tail call optimisation* meaning the compiler can rewrite it as a loop if the last instruction in the function is to
recursive call the same (or possibly different - mutual recursion) function. Functions are *first class values*, so
instead of writing the same recursive boilerplate code logic is re-used via *higher order* functions (e.g. `map`,
`filter`). As data is immutable it's often accessible within a module, unless the internal and external representation
of the type is different - but that's more about the public vs internal API. Efficient "changes" to big immutable data
introduces the need for [persistent datastructures](https://en.wikipedia.org/wiki/Persistent_data_structure). As the
data is immutable we learn to *pipeline* data much like `|` in a posix shell. Functions are building blocks so we
*compose* them, *curry* them or *partially* apply them to make new functions.

## Conclusion

This FP architecture might be described as imperative shell and functional core. The pure functions are composed in
an impure context. Others have called the architecture an impure-pure(-impure) sandwich, or depending on how the side
effecting imperative parts are implemented, maybe an OO-FP-OO sandwich. There is also an impure context, however it
can often be reduced.

All the unfamiliar FP techniques exist to maximise the functional core and correspondingly reduce the impure context
to the bare minimum. Pure functions reduce the burden on the programmer to track state and mutation. The challenge
is that, apart from languages like Haskell, your language probably has little ability to help identify what functions
are pure. You could annotate them, e.g. `@pure` in python, but whenever someone updates a functions there is burden
on the programmer to identify if a function is still pure.


