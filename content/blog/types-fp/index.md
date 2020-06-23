---
title: Typeful Development
date: "2020-06-16T19:45:03.284Z"
description: Domain Modelling
---

The acronym TDD means test driven development and is familiar to many developers. Using tests to drive design is a tool.
It's a tool that I don't particularly like - an option to help design, but still just one of many ways to
design. Often it is good to
have tests, but they don't have to exist before the code under test, especially as the design can evolve as we gain
experience from implementing it. How many of what tests (unit, integration, end to end, wider system) to write is
another discussion. It's clear that test code coverage percentage doesn't mean anything in itself, but the output line
coverage is another tool that provides feedback on what has been tested so far. Tests are good for actually operating
the software and checking if specific use cases of that software work as expected. Tests don't prove anything, although
in theory some things could be exhaustively tested if the combinations of different inputs is low enough that all
possible inputs could be executed and the output checked against expected values.

TDD also means type driven development. Types, unlike tests, do not operate the software and so cannot check that it
actually runs at all. Types are the most popular formal method in software development though and can be used to prove
somethings about the software before it even runs. Tests are useful to see that it runs and does some appropriate
things given a limited number of test inputs, whilst types help by proving that only a limited set of inputs are
accepted and that those inputs have certain properties. We use types to create more precise formal descriptions of the
valid values.

## What's a type?

One view of a type is that it is a set of values. A boolean is a really simple type, it has two values called true or
false. The underlying bytes within the computer are untyped, just
bits that are manipulated as numbers by the CPU. Our programming languages can build types over those numbers however.
A boolean's representation as a number can be 0 and 1 and even though it only requires 1 bit of information, it will
use at least 1 byte (as that is the basic addressable unit of computers) unless multiple booleans are specially bit
packed together in e.g. a bit-vector.

Reducing the number of values in a type's set makes it easier to think about. Practically though the number of values
in a set is often huge, e.g. 4 billion for a single 32bit number and so when you have just two 32bit number parameters
as inputs to a function the combinations of values (well the same as a single 64bit integer) is already thoroughly
impractical to exhaustively test. Strings are a very common type that have an infinite number of values (ignoring
memory limitations).

So, reducing the number of values in a set helps, but may have little practical benefit by itself. The greater benefit
of the type system is in controlling whether different type sets can be mixed together, e.g. mixing strings and numbers
is a type error. Javascript is painfully bad at this, e.g. letting `1 + "1"` be valid (`"11"` apparently).

There are other views of types, such as a type being a behavioural specification. I'm focussing on the data view -
types as a set of values because data is the ultimate contract. It is data that computers process, persist and transfer
between programs in potentially different languages and runtimes. Data often outlives one particular program and what
we want to do with it. Indeed, types in functional programming usually keep the behaviour (functions) separate from
the definition of the data (types). In Python we can use `dataclasses` or `namedtuples` to describe types without any
attached behaviour. Object orientation too easily complects state, behaviour and namespacing...but it's not time for a
[Kingdom of Nouns](https://steve-yegge.blogspot.com/2006/03/execution-in-kingdom-of-nouns.html) type rant or questions
of who owns the data when modelling class hierarchies.

So, how do we build our sets of values (data types)?

## Record types

A.k.a structs/objects. These simply aggregate/compose different types whilst naming the parts.

```c
struct Foo {
    int32 x;
    bool b;
}
```

In terms of [algebraic data types](https://en.wikipedia.org/wiki/Algebraic_data_type) this is a product type, so called
because the number of valid combinations of values in the set for type Foo is a product of the sets within the type.
In this case `2 * 2^32` as there are two values in the bool (boolean) set and 2^32 for the 32bit integer.
As basically every programming language has these they are pretty boring by themselves.

## Disjoint Unions

A.k.a discriminated union or perhaps enum. Many programming languages have "enums", which specifies an exact set of
values for a type.

```c
enum Colour {
    RED,
    GREEN,
    Blue
}
```

A `Colour` in this case can be one of three values. In terms of algebraic data types this is a sum type, because as
you can guess, when you aggregate them under a composite type such as a struct, you add the number of values in the
set to calculate the number of values in the composite type's set. E.g. `struct TwoColour { Colour a; Colour b }` has
3 + 3 values in the type's set of values.

Plain enumerations themselves have been around for a long time, but are not properly disjoint unions. Many programming
languages lack the ability to have data attached to each union case:

```fsharp
type Shape =
    | Square of Side: int
    | Rectangle of Length: int * Height: int
    | Circle of Radius: int
```

In object orientated languages this could be modelled as a sealed class hierarchy with abstract base class Shape and
3 subclasses Square, Rectange and Circle each with their own data. Disjoint unions are closed types - you cannot add
new subtypes without altering the definition. As an aside the Ocaml language has polymorphic variants - open disjoint
unions. A closed type disjoint union is very easy for the reader and compiler to understand before the program has run.

### Open vs Closed

An open type, such as the typical unsealed class hierarchy has some utility in that it can be extend by third party code. This is definitely useful at times, but I consider it the wrong default. Domain modelling usually aims to make
clear and visible all state to be processed. When the data is modelled as a closed type we can reason about it
statically. Awkwardly, I don't even think most OO type class hierarchies want to model the data as open, it's just that
functions (methods) are attached to objects and polymorphic functions are used to vary/extend behaviour at runtime or
to have third party code vary/extend behaviour with the same data. That can only be done if the class hierarchy is
still open (the class is not "final" or "sealed").

## Unrepresentable Illegal States

"Make illegal states unrepresentable" is a common theme in well typed domain modelling. When we have disjoint unions
*and* record types it is much easier to accomplish.  A small example could be modelling an event status as not-started,
started at timestamp or finished with a duration. Without disjoint unions records/objects are often poorly used to
model these:

```python
@dataclass
class EventStatus:
    has_started: bool
    has_ended: bool
    started_timestamp: Optional[time]
    finished_duration_seconds: Optional[float]
```

Here, we use a Python dataclass but it could easily be any class object in one of many OO languages. This model allows
us to represent illegal domain state, or most charitably, irrelevant state information given other aspects of the
state. We may incorrectly base our logic on reading `has_started=True` as implying that we are in the "started at
timestamp" state, especially as we are being careful to model `started_timestamp` as an Optional and so we will check
that it is not None. In this situation we have to know to check that `has_ended=False`, or maybe we don't even have a
`has_ended` state and instead have to check whether `finished_duration_seconds` is not None.

In the real world I've seen uglier more complicated classes. Even if you are hiding the details as private state behind
an object interface it can be bug prone for the maintainer or reader. The developer and certainly anyone less technical
will struggle to see the domain in that. There are plently of objects that encapsulate state but a lot of the
representable state is supposed to be impossible in the domain. Just being able to set `has_ended=False` and
`finished_duration_seconds=123` or `has_started=True` but leaving `started_timestamp=None` is asking for trouble as
logic becomes more complicated and other people have to read and maintain the code.

One way to do this better without disjoint union support is to create a separate record for each case. Declaring
classes can be verbose in some languages, so it may not always be done even if it's acknowledged as cleaner.

```python
@dataclass
class EventStatus:
    pass

@dataclass
class NotStarted(EventStatus):
    pass

@dataclass
class Started(EventStatus):
    started_timestamp: time

@dataclass
class Finished(EventStatus):
    duration_seconds: float
```

That's fairly concise using dataclasses. It is an open type. Full blown Java/C#/Python/Ruby classes with constructors
etc. would take up a lot of lines to convey very little information.

```fsharp
type EventStatus =
    | NotStarted
    | Started of started_timestamp: time
    | Finished of duration_seconds: float
```

A proper disjoint union, in F# this time, is even more concise. Python may not have them built into the language but
there is a third party library [adt](https://github.com/jspahrsummers/adt):

```python
from adt import adt, Case

@adt
class EventStatus:
    NOT_STARTED: Case
    STARTED: Case[time]
    FINISHED: Case[float]
```

So, by making illegal state unrepresentable you have reduced state space, the size of the set of values that your
domain type uses. Crucially, if you generate random values of that type you know that it is valid domain state, which
is where types interact with property based testing. Probably more important than the testing is being able to read
and understand the domain clearly.

## Optionals, Results

At this point a lot of developers have heard about null/null pointers/none/nothing being the "billion dollar mistake".

An Optional type is clearly useful, it models in the domain the idea that something may not exist. If your programming
language has some way to track nulls with Options/Maybes/Nullable references, or whatever their called, then a type
without that Optional annotation should never be null/none. The challenge in recent years has been that many languages
implicitly allow everything to be optional.

Results are much like optionals except when there is nothing, a failure type is conveyed instead of nothing. This was
covered more in the post on [error handling](/error-handling).

## New Types

A quick easy win for reducing errors is not reducing the number of values you deal with as it will probably be huge
anyway. Separating types within you domain is however fairly easy and something that seems heavily underused.

```python
from typing import NewType

UserId = NewType("UserId", int)
UserCount = NewType("UserCount", int)
```

Same representation, but very different uses. APIs full of primitives - strings, numbers, booleans etc. don't convey
much at all useful through the types. Maybe the data is just data and you don't want to put any in depth domain model
onto it. That can be fine, but too often the proper domain modelling never takes place.

Really a new type is just an idiom for wrapping one single type inside another with another name, which leads to...

### Nominal Types

Nominal types are a very familiar and just mean a named type. The name is used to separate the types and has some
meaning to the domain modeller. The benefit is much the same as new types. The `NotStarted` dataclass in the python
example without disjoint unions has no values (or just one value - the empty set), so the usefulness of `NotStarted`
is in it being a different named empty set compared to other named (or unnamed) empty sets. The `EventStatus` class is
also empty of data values. It's name and inheritance relationship to `NotStarted`, `Started` and `Finished` is there
to, in a more hidden way, create a three value enumeration of `EventStatusType`.

## Shrinking the State Space

The language primitives often have huge state spaces. In python the `NewType` constructor does nothing at runtime
except return the wrapped type, e.g. a `NewType("UserId", int)` *is* just an int at runtime. That makes it easier to
use - the lowest amount of ceremony possible compared to other new type idioms (e.g. in Rust it's a tuple with one
element and is accessed with `.0` and in F# it's a single case discriminated union that can be pattern matched or given
a `Value` property accessor as one example). We could trust our clients to follow any implicit contracts (fine in many
cases for getting the most value for effort out of the new type).

When exposed for wider use we can lock it down. This is what constructors or `make_*` or `new_*` functions are useful
for.

```python

EmailAddress = NewType("EmailAddress", str)

def make_email_address(s: str) -> Optional[EmailAddress]:
    ... # regex validate or return None
```

Python is very open of course, it's easy for someone to use `EmailAddress` directly, so if you want strict control
then a traditional class and more verbosity is required.

```python

class EmailAddress:
    def __init__(self, s: str):
        ... # regex validate or raise exception

    @property
    def value():
        ...

    @staticmethod
    def make(s: str) -> Optional[EmailAddress]:
        try:
            return EmailAddress(s)
        except Exception:
            return None
```

That's a bit painful though as the `EmailAddress` constructor cannot return any value, meaning it'll have to raise an
exception - something I'd prefer to avoid as discussed in [error handling](/error-handling). So we put a factory static
method in place to "hide" it (not that python has a lot of access control mechanisms). Optionally we put a property
accessor in place, whereas with the plain new type there was no accessing required. Dataclasses don't make it easier as
they are syntactic sugar for generating classes. So, I'd stick with a simple new type and `email_address` creating
function. As the language primitives are all immutable we also don't benefit as much from using a dataclass and being
able to add the `frozen=True` (immutable) parameter.

## Reference vs Value Types

Somewhat related to clear domain modelling is whether types with value / structural semantics are easily available.
Whilst it may have its place, the default reference type semantics in many primarily OO languages does not fit high
level thinking.

```python

@dataclass
class Person:
    age: int
    name: str
```

This is poor domain modelling but it does use value and structural semantics. This means we can take two Person objects
and naturally compare them for equality, i.e. if the `person.age` and `person.name` is the same as some other Person
object then they are the same, which I think is usually a better default than what we get with classes:

```python

class Person:
    def __init__(self, age, name):
        self.age = age
        self.name = name

p1 = Person(42, "bob")
p2 = Person(42, "bob")
p1 == p2  # False!
```

Here we see reference (do they have the same address in memory) equality is linked with individual instance
identity. Ordering (less than, greater than) is just as awkward, whereas with `dataclasses` we can add `order=True` and
we're done. None of that taking care to properly define a less than comparator and worrying that we should override
hashcode generation if we override equality etc. FYI `namedtuples` in python are naturally ordered.

Treating types with value / structural semantics is more appropriate when using immutable types, such as functional
first development with pure functions. Pure functions and immutable data have little interest in object reference
identity, the place in memory, as we will be making new immutable data from the old. This [what is FP](https://www.lihaoyi.com/post/WhatsFunctionalProgrammingAllAbout.html) article chooses to emphasise dataflow in FP
programming, which I've not really emphasised when talking about pure functions and FP first development, but I do
agree with it. Using immutable data and pure functions means the program data is generated and flowed
through the functions. It does not pass references to objects through the flow of the program and mutate those objects
as it goes. State aliasing and tracking state is something computers and not humans are good at.

Again, even if it's possible people may not bother with something like value / structrual semantics if it's much more
effort to create than the default reference semantics. Python at least is in good shape here if we stick with
dataclasses or namedtuples.

## Lists, Sets and Associative Mappings

Lists (whatever that means in your language, I'm thinking of something implemented as a dynamic arrary) can model zero+
instances of a type and Sets do the same but enforce uniqueness. I don't think there's much more to say. Sets are
probably underused. Along with Lists, associative maps (dictionaries, implemented as hash tables) are the work horses
of application code. Associative maps associate a single key with a value, but it's not hard to implement or just use
(e.g. `defaultdict(list)` in python) an associative map that links a single key to multiple values (multi map).

Python has literal syntax and comprehensions for sets, lists and dicts - easy to use.

## Other Types?

There's so much more that can be done with types. Keep following that road and we will end up at Haskell or Scala with
Scalaz or perhaps beyond those to languages like Idris (but that's really academic for now). Even without type systems
that can describe generic types (e.g. List[T]) at a higher level (e.g. C[T] where C is another type abstraction) there
are usually constraints we can put on [generics](https://docs.python.org/3/library/typing.html#typing.Generic).
Generics (parametric polymorphism) lets us write code once that works for different types, so the cost benefit analysis
is a bit less about domain modelling and more about saving typing or deduplicating similar code.

## TDD and Pattern Matching

So what was type driven development? Much like writing tests first, one can write well typed function signatures that
captures the program requirements as dataflow through various functions. As data is in many ways the ultimate contract
it's good and necessary for this sort of TDD to define the types first, which really just means work out your domain
model first. This is contra to writing functions/methods "defining" behaviour through the names of functions, which is
not something that compilers and type checkers can formally analyse in any useful way.

Going back to open and closed types, the closed types are fully specified and visible to the type checker. Most
languages lack one of disjoint unions (a closed type) or pattern matching. Some pattern matching features maybe present
but not exhaustive. Exhaustive pattern matching requires us to handle every "shape" or case of a disjoint union. We
can evolve our disjoint union domain type and every function that takes one as input will be checked. No problem such as forgetting to update a switch statement in language without pattern matching. If we have done our modelling
correctly we get the added benefit of only ever handling valid states in the pattern matching branches.

```python
@adt
class EventStatus:
    NOT_STARTED: Case
    STARTED: Case[time]
    FINISHED: Case[float]

es = ... # get event status instance
es.match(not_started=lambda: ..., # handle not started case,
         started=lambda started_time:  ..., # handle started case
         finished=lambda: finished_duration:  ...)# handle finished case
```

Python does not have pattern matching though the `mypy` type checker seems to be getting better at spotting unhandled
situations. The `adt` library does generate a `match` method that forces you to provide handlers for each case.

```fsharp

type EventStatus =
    | NotStarted
    | Started of started_timestamp: time
    | Finished of duration_seconds: float

es = ... // get event status
match es with
| NotStarted -> ... // handle not started
| Started startedTime -> ... // handle started
| Finished 0.0f | 1.0f -> ... // handle finished with duration of 0 or 1
```

An example of a stronger pattern matcher in F#. The pattern matcher allows us to match a finished case where the finished duration exactly zero or one seconds. This example won't compile as it does not handle all valid Finished
cases.
