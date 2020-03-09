---
title: Functional First Programming and Purity
date: "2020-02-21T19:45:03.284Z"
description: "The value of FP First"
---

There's lots of info on the web about what functional programming (FP) is. Much like the object oriented (OO) paradigm there is no concise agreed definition.
I put together an [FP Intro](https://sublime.is/fp-intro/) years ago that shows how one goes from less functional to
more functional. To some extent mainstream OO languages have been adding FP features for a long time and they may even
be used a lot. Does that make the codebase FP first though?

An FP first language is one that defaults to the FP paradigm. An FP first language (such as [F#](https://fsharp.org/)) may make non-FP -
object based and procedural programming possible, but the most natural easy thing to do is FP. Python programming
enables some FP programming but the language by default has always been OO or procedural focused. What makes a
particular Python codebase (and not the language) FP first though?

Functional first programs often focus on function composition - using functions as the basic building (lego) block
instead of objects (which complect data, behaviour, namespacing). FP first, in my view though, implies an effort to
use [pure functions](https://en.wikipedia.org/wiki/Pure_function) (referentially transparent functions) or even methods. Go look at the wiki definition if its not completely familiar.

```python

def add(x: int, y: int) -> int:
    return x + y

def div(x: int, y: int) -> int:
    return x / y

```

Here, `add` is a pure function. It does not read or write to any global (or local static) state and returns an output
as a function of its inputs. The input types (domain) are integers and the output type (range) is also an integer.
Helpfully, in python, we can even input an arbitrary sized integer without overflow problems; though arguably
integer overflow is a correctness issue and not a purity issue. A pure function that returns a value for every possible
input value is called a *total* function. Aim to write total pure functions.

The `div` function looks very similar in terms of input/output types. At first glance it is also a simple pure function.
The type signature is actually a lie though, it is not a total pure function. Dividing by zero in python raises a
`ZeroDivisionError` exception. Exceptions are impure because the caller is not forced to catch them and we do not know
where the program will resume running - referential transparency falls to pieces, we do not get the same value every
time we call it with `(x=1, y=0)`. As division by zero is undefined in mathematics we need a way to represent this undefined
case:

```python

def dev(x: int, y: int) -> Optional[int]:
    if y == 0:
        return None
    return x / y
```

That is one solution. Practically speaking, unchecked division will be more commonly used for performance reasons, at
least in heavy numerical code. So, it's a point where an agreed compromise on total purity maybe put in place.

Whilst uncommonly a focus in FP first
development, pure can can include methods. The `this` or `self` value of the object that the method is associated
with is an implicit parameter. Objects are more uncommon in FP first development for multiple reasons but the default assumption about objects is that any method on an object may mutate that object instead of returning a new copy/version of it - the OO paradigm is mutation focused.

## Why Purity

Why focus on pure functions? It's a value judgement, hopefully a clear value, that pure functions are really easy to
understand because they can be looked at in isolation. Machines are good at complicated manipulation of state, whilst humans have a harder time understanding it. Pure functions are small modules that do not depend on anything else.
They can be pipelined together without having to understand their implementations. They can be trivially composed
without error, even in a multi-threaded context. This means that the programmer with their limited ability to keep
a lot of information in their short-term memory can be confident that the correctness of the pure function
is not affected by outside extra-modular information. As they return values and don't have any side effects, we know,
by definition, that we only have to look at their outputs - there is no worry about any other state being changed.
Given all this, it's also much easier to test, just generate some in memory test input data, which is made easier with e.g. property based testing libraries like [Hypothesis](https://hypothesis.readthedocs.io/en/latest/) in Python.

Most programs can be written with far less side-effecting stateful code - they can use more purity. When this becomes
the dominant style in the program correctness and quality go up, hopefully with less effort, but learning to write
a larger program in this style has its own learning curve (much as anything does). Widely applied purity has a high
value proposition and as such for many programs it makes sense to be the default paradigm. In another post I'll say more about structuring large programs in this style.

## When not to use FP?

On a new greenfield system (where we're not dealing with legacy code and paradigms) I really struggle to see why I'd
not use FP first development.

Some algorithms can use a stateful object within the implementation
of a pure function (so the side effects don't leak out, they are invisible) where there's something natural/easy about
writing that algorithim in an imperative fashion. Graph algorithms are typically easier to follow imperatively - in
pure languages one way they maybe implemented is with the State monad and another way is to pass around [persistent datastructures](https://en.wikipedia.org/wiki/Persistent_data_structure) explicitly.

In general though, a reason to not use FP is around performance, when the program has very high CPU/Memory performance requirements. This might not be many projects and may only be important for some sub module(s) of a project.
Pure functions use a lot of immutable data that is copied or structurally shared and this is naturally going to
be slower than the in-place destructive memory updates used in mutable/imperative programming. Even if you have a language with a high quality garbage collector, say a generational garbage collector, and most of your garbage objects are collected in the young/nursery generation, it's still better not to allocate memory in the first place. It's not always the
case that memory manually allocated and deallocated on the heap is more performant in terms of latency (to release
a chunk of memory) or throughput (quantity over time). Memory allocated and collected all within the young generation
of a generational garbage collector can be quickly dealt with (as long as the older generations do not need work on them all is fine). Regardless, allocating nothing is always faster than allocating something and functional programming
will allocate more. By allocating less you are more likely to keep more memory in the CPU cache with better spatial and temporal locality. As an aside, if I want to program for performance it probably would not be object based but more
bulk/smart-batched/data-oriented procedural code, but that's another story.

## Alternative ways to get the same benefits?

Nothing has been said about the architecture of larger functional first programs. In the small/medium it should be
fairly clear that purity makes use of immutable data as we are not allowed to change any inputs or reference global state. Pure functions are safe to use in multi-threaded concurrent contexts because the data is immutable. Multiple
threads can share and read the same data with no chance of concurrent data races because immutable data is not
changed in place. A quote I liked from the book *Java Concurrency in Practice* (aside, it's a good book about concurrency and not specific to Java):

> It's the mutable state, stupid. All concurrency issues boil down to coordinating access to mutable state. The less mutable state, the easier it is to ensure thread safety. Immutable objects are automatically thread-safe. Immutable objects simplify concurrent programming tremendously. They are simpler and safer.

Those interested in systems programming have likely heard of the [Rust](http://rust-lang.org/) programming language. Rust programs guarantee
multi-threaded data race freedom and memory safety (despite having no garbage collector), unless you use the `unsafe`
part of the language, which many programs will not even touch. This is done through its ownership system which
statically (at compile time) tracks data ownership. Read xor write semantics mean that anyone can safely read data,
potentially from different threads, if the data is used in a read-only way, but the compiler only allows one live
reference to exist if any writes to that data occur. Arguably this gives you the same benefits that purity gives you -
no need to worry about aliasing and potential changes to data done implicitly behind your back in some other module.
The data is not immutable but it can only be changed by only one reference. It's a bit like that old philosophical question
*"If a tree falls in a forest and no one is there to hear it, does it make a sound?"*. Similarly, I see little problem
in using local mutable data (inside a pure function) for performance or possible clarity reasons. Languages like
Haskell will make that impossible, but any functional first language with prodecural support, like F#, can do that.

Persistent immutable data structures employ structural sharing and allow you to keep a history of different versions
of the data structure, which is useful for things like backtracking. When you don't need references to different
versions of the data though, it seems that compiler enforced read xor write is performant and easier on humans who are
not good at tracking cross-module state-change/mutation. Nothing is free of course, one of challenges of using Rust is
that you have to design your data and state update flow to have a single owner of the data and for some problems it's a harder fit.


## Compromising purity

It's possible to use a weaker definition of purity. Pure functions in the [D Language](https://dlang.org/spec/function.html#pure-functions) allow mutating the parameters to the "pure" functions (unless they are
marked `immutable`) and throwing exceptions, but do prevent access to global or static mutable data. Allowing mutation
of input parameters in Python is too weak a form of purity in my view, especially as Python does not
have argument qualifiers such as `immutable`. There might be a useful agreeable definition of weaker purity.

One area of compromised purity that I commonly encounter is logging. Logging is side-effecting. It's possible to only
log based upon all the information returned to the top level of the program (near `main` in the call stack or some
API entry point in a web framework), but maybe some useful information that you really don't want to return from
deep within a stack of pure functions exists and should be logged. In this case allowing logging in otherwise pure
functions is maybe a reasonable compromise to the definition of pure. Yes, we could try something like the [writer monad
in Python](https://bitbucket.org/jason_delaat/pymonad/src/master/pymonad/Writer.py) but it would probably feel out
of place to most python setups. We could isolate it as an [effect](https://github.com/python-effect/effect) but having
to add or remove effects to what is otherwise a stack of pure of functions, just to add logging (sometimes just Debug level), may feel a bit heavy handed.

