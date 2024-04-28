---
title: Small Languages
date: "2024-04-21T23:15:03.284Z"
description: Developing with small languages like Odin and Golang
---


What is a "small" language? I use that term for a language that has fewer "features". This tends to mean that it is
easier to learn - there's just less that you have to understand. [Golang](https://go.dev/), for example, is considered
a language that you can "learn in a weekend". I deliberately use the term "small" instead of easy or simple. It's
probably true that a small language is easy in some ways (such as quick to learn and fit in your head). It may also be
simple - the opposite of complex, which is more about how features intertwine or "complect" (as Rich Hickey's [Simple
made Easy](https://www.infoq.com/presentations/Simple-Made-Easy/) keynote goes into detail on).

Why am I looking at any small languages? Isn't there a danger that if you try to move lot of features out of your
programming language then you are just going to move more complexity into your program? Well, perhaps that is true. In
the lower level high performance language space I am still generally happy with what we can do with
[Rust](https://www.rust-lang.org/). Using Rust for CLI tools, web services and python native extension modules has been
a decent experience. Slightly higher level, where there is more functional first programming using immutable data and
automatic garbage collection for memory, the [F#](https://fsharp.org/) language still feels like a good language as
[covered in the past](/why-fsharp), though probably more niche than Rust at this point and less likely to be picked up
by those not involved in the dotnet ecosystem. I'm focussing on top performing languages - F# is plenty fast enough for
many things, though not "top" performing, therefore I'm really comparing any small language with Rust.

For all the good things about Rust, sometimes I wonder if the "type tetris" friction can be reduced. Rust is quite a
verbose noisy language. This is by design and is good in some ways - it's being explicit, which is what people often
want when focussing on performance and getting a handle on what their code is doing. The friction does seem to reduce
with practice and any problem seems solvable (such as combining lifetimes with async code) given enough effort, yet
sometimes it feels like a lot of effort not related to the domain problem.

As an example of the type tetris, consider a [newtype](/types-fp/) for a UriPath, pretty basic and important to domain
modelling in my view. In Python that's just `UriPath = NewType("UriPath", str)`. Let's say I want to use a UriPath in a
hashmap in Rust, then I need to derive a bunch of things and maybe implement a couple of traits, which is quite a lot of code.

```rust
/// Path component string of a URI, e.g. `/foo/bar`
#[derive(Debug, Clone, Hash, Eq, PartialEq)]
pub struct UriPath(pub String);

// Allow a &str where &UriPath needed. Hash map key lookups allow using borrowed forms of the key.
// iter.any() on Vec instead of .contains. Also allows using borrowed forms of data
impl Borrow<str> for UriPath {
    #[inline]
    fn borrow(&self) -> &str {
        self.0.as_str()
    }
}
// Allow comparing &str to &UriPath, e.g. in Vec.iter.any(), without explicit `borrow` call
impl PartialEq<str> for UriPath {
    #[inline]
    fn eq(&self, other: &str) -> bool {
        self.0.as_str() == other
    }
}
```

Other times in Rust we have features that lets us write less code, but it makes the language more magic, e.g. derive
macros and [procedural macros](https://doc.rust-lang.org/reference/procedural-macros.html). Many projects use the
[serde](https://serde.rs/) crate for serialization and its many macros which significantly increase compile time.
Benefits often come with tradeoffs / costs. That's clear with something like the [Pin trait](https://doc.rust-lang.org/std/pin/index.html)
in Rust - it's not part of your domain problem, it's complexity brought in by the language. Who knows, maybe people
will develop coding standard dialects that say which features you can use - a sign of complexity that C++ has had
plenty of over the years.

## Odin (and Golang)

[Odin](http://odin-lang.org/) is the small language that has taken most of my interest. Apart from being smaller than
Rust it does somethings better than Rust. At the same time it is a "better C" language (like
[Zig](https://ziglang.org/) and Jai), therefore it is very suited to high performance programming. [Custom
allocators](https://www.gingerbill.org/series/memory-allocation-strategies/) in Odin are easy to work with and central
to the language design (see the [context system](https://odin-lang.org/docs/overview/#implicit-context-system) which is
part of the languages default calling convention). In Rust you can replace the default global memory allocator from
your usual system allocator to something like [mimalloc](https://lib.rs/crates/mimalloc), but doing something like
collection specific allocators or the extremely challenging control of how all allocations between two points in the
code occur, may cause headaches! There is a Rust working group for allocators. Controlling allocators at the per
collection level is still, after many years, a nightly feature, so not available on the stable release.

I've never really been that interested in learning Golang.
[This](https://fasterthanli.me/articles/i-want-off-mr-golangs-wild-ride) and
[this](https://fasterthanli.me/articles/lies-we-tell-ourselves-to-keep-using-golang) article give a perspective on how Go may lack
in terms of correctness and domain modelling compared to Rust (or any other ML like language such as F#). Even though
it's higher level than Odin (e.g. it has garbage collection, it's not a systems programming language) it does some
core correctness features worse than Odin in my view.

### New Types

Golang doesn't have good support for new types. It seems you may be able to do some verbose painful things with Go
interfaces, but no one says there's reasonable new type support.

Odin has the keyword `distinct`. It's pretty much as succinct as Python and you see distinct used a lot in the core
library code.

### Understanding Points of Mutation

Odin and Golang do not having anything like the Rust borrow checker system. As they are lower level languages than something like F#, you are unlikely to see a lot of immutable data and pure functions, so understanding ownership is
something you have to do by design/convention.

Golang code seems to pass pointers to objects all over the place. Unlike Rust or C++ there's no way to read the code
and clearly understand whether a pointer is intended to be mutated or just used to read data. In Rust we have a shared
read only reference type like `&Foo` or a mutable uniquely owned borrow such as `&mut Foo`. C++ has many safety
limitations compared to Rusts borrow checker, but you can pass `const Foo&` and know that the parameter is meant to be
read and not mutated.

Neither Golang nor Odin give much support for pointer arithmetic, so at least we know that the pointer itself cannot
be mutated. We have no idea if the pointed to object will be mutated with Golang though:

```go

// How do we know whether x will be mutated without reading the code or docs?
func addOne(x *int) {
  *x++
}
```

Yes, you can pass by value instead as a way to stop the function from mutating the pointed to thing, but if it's a
reasonably large type then it's inefficient to make a full copy.

What about Odin? If the intention is to mutate it then we pass a pointer `^Foo` other we just pass `Foo`. The compiler
optimizes this to passing a pointer for performance if needed. You can take a copy of `Foo` by shadowing its variable,
but by value parameters are immutable by default.

### Error Handling

As mentioned in the post on [error handling](/error-handling), Golang returns error values, e.g. `(value, error)`
tuples. This I generally still find preferable to using exceptions. It's quite easy to ignore the error part in Golang.

Odin is fairly similar, but I'd say a bit better. The type system is not going to force you to check for an error
condition the way it does with Rust, but the most ergonomic friction free way to use the language often involves the
[or_return operator](https://odin-lang.org/docs/overview/#or_return-operator) that works with any number of multiple
return values. It just assumes the last value in the return tuple is the error condition. The operator gives ergonomics
similar to Rust's `?` operator (which used to be a `try!` macro).

Less friction and better ergonomics means we are more likely to do the correct thing by default.


### Tagged Unions

A.k.a discriminated union or disjoint union as covered in the [types post](/types-fp/). Along with new types these are
very important for good domain modelling and correctness. Nothing much in Golang here, but to my surprise
[Unions in Odin](https://odin-lang.org/docs/overview/#unions) are tagged and low friction to work with. When it
comes to error handling, unions make it easy to combine types and return error values that are type X or Y or Z without
degenerating the error into some "base" type that loses details. Matching on unions with the `switch` statement will do
exhaustiveness checking - ensuring no case is missed unless you explicitly do a `#partial` match.

### Foreign Function Interface

Odin has a [foreign (FFI) system](https://odin-lang.org/docs/overview/#foreign-system) to easily call C code (or any
C++ code that exports functionality with the C FFI). Additionally it comes with a lot of maintained bindings to C
libraries in certain domains (particularly around games and graphics).

Golang has something in this area, "cgo", but Golang's VM makes it hard to interoperate with the C ecosystem. Tools
like debuggers and linkers from the C ecosystem do not work with Golang, whereas they do with languages like Odin.  How
much error prone friction and boilerplate there is with cgo is hard to comment on without experience. Due to the
difficulties, a suggestion is to only interact with Go code via a network boundary - it certainly does have a well
developed ecosystem around the web and networking. There's quite a lot of overhead to calling C code, so as with Python
native extension modules, if you managed to get cgo working correctly, try to maximise the work done within each call
across the language boundary.

### Similarities

Both languages use default zero value initialization, which feels like a very systems programming like thing - i.e
allocating the memory is separate to making a valid value. Note C++ may let you forget to initialize a value, but you
have to explicitly opt into that for Odin (and it would be very rare). To make sure your types are always in a valid
state, it may help to make a zeroed out value valid in some way or a sentinel type.

In some languages constructors ensure you get back some valid value. Values in Rust often cannot be created without
using the conventional `New` function associated with a type (the type is private to a file or crate). In Odin you
often have a conventional function e.g. `foo_init`, but there is no way to stop you creating a zeroed out value unless
the type is completely opaque, e.g. hidden behind a `distinct rawptr`.

Odin has `nil` as a value and it's the default init value for some types. So does Golang. The [or_else
operator](https://odin-lang.org/docs/overview/#or_else-expression) and the `Maybe(T)` type make it less problematic.
Whether `MaybeT` is used much, I can't say, as the `or_return` operator can also ergonomically handle `nil` values.

Both languages have very fast compile times. For release builds with Odin the bottleneck is always the LLVM code
optimization and generation. Debug builds are subsecond for small projects.

Both languages also have limited metaprogramming - e.g. no macro system and limited builtin reflection. As both
languages are small with simple grammars, they both seem to have core library tooling for parsing a source code AST
from which you can potentially generate more code.

I don't know if `go build` is the main way people build their Golang programs. In Odin `odin build` is the main
approach. There is no opinionated higher level tooling for building your programs, anything you add on top is up to
you. As it's a compile everything from source type of language it does seem straightforward. I've created my own tiny
[Odin project skeleton](https://github.com/enerqi/odin-lang-skeleton) for running/building with [Sublime
Text](https://www.sublimetext.com/). It's really not much. Like Golang, there is an LSP language server to help you
develop in any editor and a code formatting program that is part of the language server project. Linting can be done
with the right compiler flags (bit like `cargo clippy` for Rust).

### Where is Golang better?

Odin doesn't have a highly developed web service ecosystem. There's nothing like an async runtime built into the
language and a I suspect there never will be. That's in contrast to Zig, another better C language, which is developing
async support.

The Package manager, maybe. Odin does not have an official package manager. The concept of packages is very similar for
Golang and Odin, so it's not a hard problem to create one (it's just a single directory of files with the same package
declaration). Before Golang had a package manager you selectively "vendored" (took a local copy somewhere on the
`GOPATH`) of the project's source code, e.g. with `git subtree`. Odin is similar - you can import other packages with
releative imports to your repository after vendoring the code somewhere within your project directory, or you can add a
folder to the "collection" list given to the compiler. At this point most languages seem to have a package manager,
though that's not universally considered a good thing. Package managers help you to discover packages at some
centralized place; and the ability to auto update, or at least easily update, many packages to deal with security
issues is a positive. On the other hand, when packages are easy to pull in, especially lots of transitive ones, it's
easy to feel like you don't understand your dependencies - you have not been very selective, some code maybe poor and
slow etc. At this point the sheer number of packages leads to more potential security issues from all the features and
code bloat that you don't actually want. Note, for C/C++ something like the operating system package manager on a POSIX
OS could be considered a package manager for the language - when the "dev" version of a package is installed it's
usually to install the C/C++ header files in a well known location (which assumes you don't want to do any custom
modifications). After many decades C/C++ now have some package management, perhaps initially driven by continuous
integration challenges (?), with [vcpkg](https://vcpkg.readthedocs.io/en/latest/#) and [conan](https://conan.io/).
Those package managers may just reflect the fact that working with CMake (or other less popular alternatives) to build
C/C++ code can be a nightmare. The compilation model for Odin and Golang with their simple concept of a package is
easier.
