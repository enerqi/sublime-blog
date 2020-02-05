---
title: CPU Mechanical Sympathy
date: "2020-02-04T19:45:03.284Z"
description: "Memory access dominates performance"
---


Software performance (*how* things happen) can be judged by various metrics - power and other resources consumption, scalability
(horizontally, vertically, concurrency/parallelism), throughput and latency etc. An individual program maybe dominated
by IO (input/output) costs - that is the program is waiting on information from the network, from disk or from other
programs. Although optimisation of IO bound programs is certainly relevant (through things like supporting asynchronous
multiple concurrent tasks or batching), optimising a program is commonly associated with improving performance when
the data is available in memory - and so is CPU/Memory bound.

CPU/Memory bound programs in many years gone by could be associated with hand optimising programs by writing assembly
code and counting CPU cycles of various CPU instructions. Thinking of optimisation there's a lot of different concepts
that are high or low level:

## Higher Level Optimisations
#### Algorithms and work done

Understanding what you want to accomplish and understanding what the CPU is doing. Following from that is the idea of
just avoiding unnecessary work and taking fewer steps to achieve what you want.
Algorithms and datastructures may often be framed as trade off between memory and CPU - memory can be used as a cache to avoid re-computing certain things, however, even if you had near infinite memory it can be less performant to use
memory as a cache that just re-computing things.

#### Data structures and complexity analysis

[Complexity analysis](https://en.wikipedia.org/wiki/Analysis_of_algorithms) is interesting and important, but is
typically irrelevant to performance until the number of items in a datastructure (or processed by an algorithm) is
"reasonably" high - which for a primitive type like an integer means >> 1000. On top of that choosing an optimal
enough data structure or spotting a silly algorithm that does way too much work is usually low hanging fruit that
provides some benefits but can still have a *long* way to go on making a program really fast.

## Lower Level Optimisations
#### CPU operation costs

Understanding the relative CPU cycle cost of different operations e.g. add/subtract > multiply > div/modulus.

#### Running programs

Understanding the high level idea of a stack frame, how they are created and consequently what the cost of a function
call maybe in setting up that stack frame. Understanding the cost of a virtual ("polymorphic") functions vs one that
is known at compile time.

#### Pipelining

Your CPU is probably [Superscalar](https://en.wikipedia.org/wiki/Superscalar_processor) which means the
Fetch-decode-execute cycle can do more than one thing at once and have multiple instructions active
(being fetched, decoded and executed).

As we can have multiple instructions in flight it is better to have instructions that don't depend on the result of a
previous instruction (otherwise it has to wait on the result coming out of the pipeline).
Conditionals/branches (if/else/switch etc.) should preferrably be easily predictable by the cpu.


## Most Importantly, Memory Layout and Access

There's probably many more optimisations that I'm not really thinking of and thankfully maybe compilers mostly take
care of or do a good enough job that the return on time spent optimising it ourselves is not worth while. Overall
most of those optimisations are really low priority compared to considerations of memory layout and memory access.
Understanding memory layout implies we should learn what our programming language is doing when it puts our types
as bits/bytes in virtual/physical memory. Maybe learn about heap allocations vs stack allocations and custom
allocators, which is mostly hidden in higher level programming languages. Even in higher level progamming languages
it's worth getting at least an overview of how garbage collectors work.

The most costly slowdown that our programs suffer from these days is accessing memory, more specifically
accessing bits of memory that are not cached (in the CPU's L1, L2 or L3 cache). For CPU/Memory bound programs this is
*the* cause of poor performance (at least if we've sorted out any silly algorithms or poorly thought out data structures used to access thousands of elements). This was not always the case, back when CPU and memory speeds were
similar and much slower. The part of our modern CPU that does work is a veritable monster super computer compared to
the machines around 20+ years ago, but it has become more difficult to keep them busy with data to work on. This is
where the programmer still has to do the work to bring about the performance, the compiler cannot magically fix all
of our poor memory layout and runtime access patterns.

To understand the problems and solutions in more details around how to give your CPU lower latency access to your
data there is a long, but very good, article that you can search for "What Every Programmer Should Know About Memory" by Ulrich Drepper available as a PDF. That article seems to come up on programming news links every couple of years.

A lighter but excellent guide to modern x64 CPUs and caches is the [Handmade Hero Chat 017 - Modern x64 Architectures and the Cache](https://www.youtube.com/watch?v=tk5P7mt2fAw) video by Casey Muratori. It's a very good return on time spent.

## Mechanical Sympathy

Understanding how your code works in mechanical sympathy with the CPU and hardware is necessary for good peformance.
I felt like using the term "mechanical sympathy" as I was reminded of the informative blog [mechanical sympathy](https://mechanical-sympathy.blogspot.com/) by Martin Thompson who has contributed lots of interesting peformance work
and given [educational presentations](https://real-logic.co.uk/about.html) on the subject.
