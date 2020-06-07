---
title: FSharp?
date: 2020-06-05T11:45:03.284Z
description: Why and Future for F#
---

Following the recent FSharp conference online I note a [discussion](https://www.reddit.com/r/fsharp/comments/gx8iff/what_can_we_do_to_boost_fs_profile_adoption_and/)
on Reddit about boosting F#'s visibility, adoption and what the challenges are. So, some thoughts on the pros and cons.


## What I Like

Much about the language itself is right where I want it. Type inference with automatic generalization. Algebraic data
types, or in more familiar terminology records (structs/objects) + discriminated/disjoint unions (enums that can have have
attached data). Domain modelling and making illegal states unrepresentable are a pleasure with this type support. On
top of that we have exhaustive compile time checked pattern matching including active patterns (extensions to pattern
matching) that ensures we have handled the different states that we do represent in the domain model. Naturally, it
is a functional first language with persistent immutable data structures for things like Lists, Maps and Sets and the record
types are by default immutable. The language has decent performance and access to imperative features for heavy
optimization. As a language it is great for standard business CRUD modelling and development, not just for obvious mathematical/calculation domains. There's a lot of information
about F# in the [Why use F#?](https://fsharpforfunandprofit.com/why-use-fsharp/) article at fsharpforfunandprofit.


## What Others Like?

### Types

In many ways I think the development world is still learning to use types
better, do better domain modelling and making illegal states unrepresentable - there's a long way to go. Many people
won't have learnt to use types better as their mainstream language doesn't make it easy. I still want to write about
how to do this better in Python.
People may not care and just
want to get stuff done despite the extra complexity of poorer domain modelling or potential prolific spaghetti mutable
state when not developing FP first. Everyone has limited time to use to learn new things.

Many who like using heavy type constraints (or pure functional programming) will prefer using [Haskell](https://www.haskell.org/), Scala with [Scalaz](https://github.com/scalaz/scalaz) or
[PureScript](https://www.purescript.org/). F# doesn't have type classes or higher kinded types for some sorts of
advanced static type constraints. For myself that's a choice and I'm not sure about the tricks that e.g.
[FSharpPlus](https://github.com/fsprojects/FSharpPlus) uses to get some of these features even though they are not
in the language.

There's also people who choose dynamic typing. That maybe because their experience of other statically typed languages
doesn't deliver enough benefit for the cost, such as poorer domain modelling or the difficulty of making illegal
states unrepresentable. Prototyping can be quicker without typing. There's also perfectly reasonable arguments to be
made that in many programs information shouldn't be wrapped up in a domain model, it just adds another layer to wade
through - particularly if you just want the information but not the domain. In regards the language itself,
[Clojure](https://clojure.org/) in my view is the best general purpose dynamically typed language. Yes, being
functional first is part of Clojure's appeal. The usual remark about [homoiconicity](https://en.wikipedia.org/wiki/Homoiconicity)
and the enlightenment of Lisp (Clojure is a modern Lisp dialect) is only a small part of it.

As an aside, there are recent history papers for both [F#](https://fsharp.org/history/) and
[Clojure](https://clojure.org/about/history) created for the HOPL IV conference series (history of programming
languages). This conference comes around every 10-20 years and gives a lot of insight into language design.

### Functional Features

There's a view that as more mainstream languages acrue functional features we don't need a functional first
language. After all, Python isn't functonal first yet I'm trying to show how to do a reasonable job of functional first
development with it. I've seen plenty of comments that going functional first in C# is quite ugly if done at the
larger scale, but maybe it can work. C# is gradually acquiring those functional features. It has added better null
handling and some form of pattern matching. Perhaps in C# 10 it will also have (discriminated/dijoint) unions which
combined with pattern matching is quite the killer combination for domain modelling. This won't make C# functional
first by default though. From what I've seen of the new features there
are still holes around catching problems at compile time with the null handling and pattern matching features, but
the existence of those features alone will make people question what F# has to offer over C#.

### Cognitive Independence

A benefit of all hosted languages, like F# on .NET/CLR or Scala/Clojure on the JVM is the access to all the libraries.
F# is not the primary language on .NET though. The notion of language independence was brought up in the recent fsharp
online conference. It's situation dependent, but some people want more cognitive independence from .NET and C#. There
are parts of using F# that require reading C# related documentation and using very object orientated tools.
[SAFE stack](https://safe-stack.github.io/) is an improving batteries included web stack initiative for
writing functional first web applications. It includes frameworks like [Saturn](https://github.com/SaturnFramework/Saturn) that provide an F# centric approach to web development using underneath the fundamentally object orientated
but high performance and reliable asp.net core web server. That said, I'm sure there's stuff to be done to reduce the
need to know about the underlying OO C# model.

Sometimes that independence is problem as well. F# provided the first implementations of async and generics on the .NET
platform a long time ago. C# eventually had these features but done independently in a slightly different way such that
using C# APIs from F# can be an annoyance and cognitive burden to understand the slight differences. Tasks in C#
vs Async in F# is an example. Only in the upcoming .NET 5 release will have F# have a natural task compatible
computation expression.

### Performance

Finally, yes, those who really care about performance (which can include myself at times) may prefer Rust. I still
think Rust is a bit young for standard CRUD webservice application development but it's getting there. In my
[first post on FP](/fp-first) I mentioned that Rust can give most of the benefits of pure functions with its ownership
model whilst remaining mostly imperative which is more familiar to many mainstream developers.

## Ecosystems

So far, my most useful production work using F# has been with [Fable](https://fable.io/), the F# to Javascript
compiler. Typescript is the current popular technology for adding type contraints to frontend projects, but yeah it
doesn't have the full package of algebraic data types and pattern matching. F# Fable programs typically embrace
[Elmish](https://zaid-ajaj.github.io/the-elmish-book/#/) -functional first development with MVU
(model view update) / unidirectional data flow architectures. There's much to like about it, yet Typescript can be a
very gradual change for JS developers - a smooth onboarding process. Using F# requires learning something about the
F# and .NET ecosystem of course. Fable compiling to Javascript means the APIs and packages are NPM focussed but
documentaton and tools is naturally going to reference .NET in places. It's that cognitive independence issue again,
which is why some may prefer the [Elm language](https://elm-lang.org/) or [PureScript](https://www.purescript.org/) - functional first and built only for compiling to Javascript.

So, investing in F# and its ecosystem may imply that you'd want to use F# on the server side aswell to get more value
out of your learning. I've found the F# tooling pretty good in general, at least for Fable development, but the Reddit
discussion shows that the IDE experience could be improved for some people. My biggest annoyance with .NET development
in general is that go to source / view source is often not available for 3rd party libraries, due to the way libraries
are downloaded as DLLs and not as source code. I've seen some improvements here, but still it could be better.
Somewhat strangely, [Jetbrain's Rider](https://www.jetbrains.com/rider/) IDE may work better than Visual Studio for
F# development judging by some complaints. Visual Studio Code with the Ionide extension has worked well for me.

An issue for the .NET ecosystem has been the transition to open source and the cross-platform dotnet core runtime.
It's another cognitive dependence issue, where people would find out that maybe IDE tooling would require the .NET
framework (Mono on Linux/Mac) even when you trying to develop with dotnet core. F# [type providers](https://docs.microsoft.com/en-us/dotnet/fsharp/tutorials/type-providers/)
may only have worked on .NET but not dotnet core and the same for the interactive REPL (which really should be a great
feature to highlight). Thankfully, this is getting ever better, but not all open source libraries support dotnet core.
Dotnet core 5 (November 2020) should be a big milestone improvement and .NET 6 (November 2021) will aim to have one
unified platform marketing everying as just ".NET", not core or framework etc.

## Niche

From a promotion perspective, F# doesn't have any obvious niche. It's just good for general purpose programming.
It's not known for AI, data science or machine learning like Python, although there's effort starting there. Game
development with things like Unity are C# focussed. Web application with Fable is great but desktop development is
often done with WPF. Even though I think WPF is horrible the IDE tools for UI creation are C# centric again. Services
with databases often use an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) and again I find ORMs
pretty horrible but the tooling and IDE support for Entity Framework is something that C# has and F# does not.

## Open Source

F# and dotnet hasn't been open source for that long. Before open source many of the non-Microsoft development shops
regarded .NET with suspicion, perhaps reasonably so given the monopolistic practices of the company's early years.
From the Reddit discussion it seems clear that for somethings there's too many libraries to choose from and it can be
hard to know what library is robust and enterprise ready, meaning it's a no brainer to use. Python has been around
as an open source language for a long time and has enough criticial mass of developers to get most libraries right.
Open source does have a problem with boring jobs taking a long time to get sorted and Microsoft doesn't put as many
resources into F# as it does C#. Mark Tarver's post
[The Problem of Open Source](http://www.marktarver.com/problems.html) is worth a read.


## Overall

I'm optimistic about F#. Selling it just because it's a "better" language is definitely a challenge though.
