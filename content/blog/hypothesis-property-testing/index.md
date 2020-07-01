---
title: Property Based Testing in Python
date: 2020-07-01T11:45:03.284Z
description: Clean testing thoughts and leveraging the hypothesis property testing library
---


In software, "testing" usually means functional testing. Writing functional tests means testing an API, a contract, an
interface. It's about what is tested and not how. Note, performance testing and all its variations is the obvious form
of "non-functional" testing that software goes through - metrics about how it works and not what it does. Following
some general notes on testing, this post looks at property based testing, a form of functional testing.

## Software Layers

Software is usually built with a combination of *top-down* (defining the high level API / feature / contract first)
and *bottom-up* (the building blocks first), not one to the exclusion of the other. Top-down and bottom-up is reference
to the idea of layering software. A low level "primitive" or "unit" function is called by a higher level function,
that may "integrate" other low level functions. This in turn can be integrated with even higher level functions until
the function is top level and defines something of tangible value (business, feature, end user).

![brick layers](../../assets/brick-texture.jpg)

Each function, at any layer, has a contract, a public API. The overall shape of layers could be like a straight brick
wall or a pyramid (fairly common), but even an inverted pyramid if the building blocks are re-used in many places.
Source code does not have to be layered but architecting as a layered pyramid or a directed graph without cycles (or
with minimal cycles but only at the same layer) is important to achieve goals such as better
[coherence/cohesion](https://en.wikipedia.org/wiki/Cohesion_(computer_science)), reduced coupling, single
responsibility and DRY (don't repeat yourself) code. Lack of layering will lead to circular dependencies. [Functional
first](/fp-first) code that maximises pure functions and minimises unnecessary state naturally tends towards this
layered architecture, because of the idea of building a pure functional core around which an imperative impure shell
exists. This architecture is harder to arrive at without effort in OO development but is captured by the [Ports and
Adapter / Hexagonal architecture pattern](https://en.wikipedia.org/wiki/Hexagonal_architecture_(software)).
Interestingly, in F# programming [circular dependencies are
disallowed](https://fsharpforfunandprofit.com/posts/cyclic-dependencies/) between source code modules - you are forced in the direction of a better architecture. In Python programming you have to separate out and layer
somethings better (more so than in e.g. Java or C#) because circular imports between modules cause run time errors.

## Thorough testing?

When it comes to writing thorough tests, the number of which can often be helpfully reduced by leveraging [typeful
development](/types-fp) to constrain the inputs, the sure way to succeed is to write tests for every layer of the
software stack. What makes a single test valuable is another discussion. In general testing the contract / interface
/ api of the function under test - what it does should be the main point, hopefully in an isolated way that could run
in parallel and with as little environment setup as possible (a good point for pure functions). So, test the lowest
level units. Test the functions that integrate the units and so on all the way up to the end to end tests or "system"
tests that make multiple processes work together, same host or distributed. I tend to prefer more thoroughly testing
the lower level units, as they are maybe the core building blocks of many other higher level functions, but also more
thoroughly doing the user level / end to end tests as they provide the core value. There are [strong
opinions](https://henrikwarne.com/2014/09/04/a-response-to-why-most-unit-testing-is-waste/) and reasons given for
[preferring one](https://testing.googleblog.com/2015/04/just-say-no-to-more-end-to-end-tests.html) and [or the
other](https://blog.twitter.com/engineering/en_us/topics/insights/2017/the-testing-renaissance.html). Ultimately value
comes from testing where there is greatest risk, but you still have to be able to identify risk.

When unit testing is reduced then the tests of the higher level functions have to be more thorough, which can be extra
challenging as those higher level tests tend to be relatively much slower.

## Avoid mocking

Whilst the ratio of unit to high level tests maybe unclear, I'd certainly avoid behavioural testing which is a form of
white box testing and so more non-functional in its nature (almost a performance test). Code bases with lots of mocks
and spys that are used to verify that x called y, how many times and in what order are fragile - easy to break by
changing the implementation details. Hopefully it will become clear but functional first architectures favour
["classical" testing](https://martinfowler.com/articles/mocksArentStubs.html) and thankfully I think "mockist" testing
is dying in popularity.

Python in some ways makes mocking too easy. The `unitest.mock` library can easily patch functions to create actual
mocks or stubs or fakes (not actually "mocks"). It's not as highly coupled as behaviour verification testing but can
still be far too coupled. A solution to that is [dependency
injection](https://en.wikipedia.org/wiki/Dependency_injection). It looks different in an FP first architecture due to
the avoidance of side effects - the maximisation of pure functions. As it is in many ways the last challenge in
settling on a general high level FP first architecture, it will have to be its own series of posts.

## Concrete tests

Most tests are written in a concrete example style - existential logic. There exists *this* input and following a call
to *this* function there should exist *this* output. We use types to describe universally quantified logic - for all
values of x, x is an integer etc. This is a theorem that a compiler / type-checker proves statically. That's what the
whole [Curry Howard isomorphism](https://stackoverflow.com/questions/10212660/curry-howard-isomorphism#10212828) (types as propositions) is about.

```python
def add2(x: int) -> int:
    return x + 2

input_value = 2
output_value = add2(input)
expected_value = 4
assert output_value == expected_value
```

A concrete test is one of the clearest forms of documentation for using the unit under test. The `add2` function is
pure, so it's easy to actually call (nothing external to it need be reasoned about). Pure and easy or not,
unfortunately many functions are only happy path tested and often not even all of the happy paths.

## Property tests

We can create better constrained types to reduce the state space - the number of possible input values. The other
approach is to generate more input examples. To do this efficiently (in terms of development time) this needs to be
done by the computer. This means that our tests do not involve writing directly in source code mappings of input values
to expected output values. Instead the input values will be generated for us. So, why is it called property testing?
We have to test general logical properties that relate the inputs to the outputs and not hardcoded values.

```python
from hypothesis import given
import hypothesis.strategies as st

@given(st.integers())
def test_add2_then_subtract2_equals_inputs(some_integer):
    x2 = add2(some_integer)
    assert x2 - 2 == some_integer
```

The [Hypothesis](https://hypothesis.readthedocs.io/en/latest/) property testing library will work with `pytest`
automatically after installing the `hypothesis` package. The trivial property here is that `((x + 2) - 2) == x`. A
common example in property testing tutorials is with lists:

```python

@given(st.lists(st.integers()))
def test_twice_reversed_unchanged(some_list):
    assert reversed(reversed(some_list)) == some_list
```

This should be an obvious kind of property to test for any sort of encode/decode or serialise/deserialise library.

### Value generators

`st.integers` is a strategy that generates "random" integers. Property testing is not random like [Fuzz testing](https://en.wikipedia.org/wiki/Fuzzing) where it's fine to generate invalid junk data. The strategies generate specific
types controlled by the programmer. Property testing was first widely used in Haskell (and Erlang) programs. In those
languages and [many other languages](https://en.wikipedia.org/wiki/QuickCheck) that have a property testing library
the strategy is called a generator, but I guess that conflicts with Python's actual generators. In Haskell the type
system is advanced enough that the compiler could often automatically generate types that match the required function
inputs. In dynamically typed languages like Python the programmer generally must specify appropriate generators,
though hypothesis can infer strategies from type annotations.

```python

class Colour(Enum):
    RED = auto()
    GREEN = auto()
    BLUE = auto()

UK_POSTCODE_RE = r"^([A-Za-z][A-Ha-hK-Yk-y]?[0-9][A-Za-z0-9]? ?[0-9][A-Za-z]{2}|[Gg][Ii][Rr] 0[Aa]{2})$"
few_primes = [2, 3, 5, 7, 11, 13, 17, 19]

@given(st.booleans(), st.characters(), st.dates(),
       st.emails(), st.floats(),
       st.one_of(st.sampled_from(Colour), st.none()),
       st.sampled_from(Colour) | st.none(),
       st.sampled_from(few_primes),
       st.fixed_dictionaries({"name": st.text(), "age": st.integers()}),
       st.lists(st.integers(), min_size=1, unique=True),
       st.from_regex(UK_POSTCODE_RE, fullmatch=True))
def test_something(some_bool, some_char, some_date,
                   some_email_str, some_float,
                   some_optional_colour,
                   another_optional_colour,
                   some_early_prime,
                   some_person_dict,
                   some_unique_integers,
                   some_postcode):
    ...
```

Those are just some of the built in strategies. We can generate random strings from a regex `from_regex` and other
examples like `integers`, `ip_addresses`, `sets`, `tuples` and `uuids`. Naturally we can generate `text`.

You can use any hypothesis strategy as utility value generators, for tests or not:

```python
st.integers().example()
printable_ascii = ... # characters sequence or strategy
st.text(min_size=1, max_size=10,
        alphabet=printable_ascii).example()
```

The initial calls to `example` seem biased towards boundary values like `0` though, not your typical pseudo
random number generator.

### State space control

The state space is infinite for many of these value generators. It is a good idea to start by not constraining them if
your actual types are equally as unconstrained, then you will quickly see what needs improving about your types or
handling of the data. You won't just get typical happy path inputs, there will be things you have not handled properly.

`st.floats()` obviously generates floats. Without any further constraints the strategy allows infinity and nan (not a number). Limiting the range with `st.floats(min_value=-360.0, max_value=360.0)` or specifying `st.floats(allow_nan=False, allow_infinity=False)` will control that.

`st.text()` is good for a unicode world, it will generate utf-8 valid strings, emojis and all. To limit to ascii use
we could use

```python
st.sampled_from("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ")`
# or more concisely
st.text(alphabet=string.ascii_letters + string.digits)
```

maybe with all of `string.printable` instead.

The parameters passed to strategy functions give limited constraint control. Every strategy object has a filter method
that returns another strategy so you can customise the values further

```python
even_positive_integers_strat = st.integers(min_value=0)
    .filter(lambda x: x % 2 == 0)
invalid_uk_bank_sort_code_strat = st.text()
    .filter(lambda s: re.match(r"[0-9]{8}$", s) is None)
```

Note, hypothesis will complain (all complaints can be controlled with profile settings though) if the `filter` fails to
find many matches.

```python
st.integers(min_value=10_000).filter(is_prime)
````

st.integers will generate lots of values above 10,000
but many will fail the hypothetical `is_prime` filter which can slow the tests or make them give up. The default
profile, that can be changed globally or per test, is to run 100 tests. Example default profile change follows:

```python

hypothesis.settings.register_profile("heavy",
   max_examples=500,
   verbosity=hypothesis.Verbosity.verbose,
   deadline=datetime.timedelta(milliseconds=500),
   suppress_health_check=[hypothesis.HealthCheck.too_slow])

# Default to heavy
# Override with environment variable or
# pytest cli arguments e.g. --hypothesis-profile "default"
hypothesis.settings.load_profile(
    os.environ.get("HYPOTHESIS_PROFILE", "heavy"))
```

After a strategy does generate a value it's always possible to map a function to that value.

```python
st.lists(st.integers()).filter(lambda x: x % 2 == 0).map(sorted)
```

This example turns a random list of even integers into a sorted list.

### Custom composite types

```python
@dataclass
class Foo:
    a: int
    b: str
    c: bool
    d: Optional[float] = None

# The wrong way
@given(st.integers(), st.text(), st.booleans(), st.floats() | st.none())
```

Given a custom composite type like `Foo` we'd like building a "random" example to be easier. `st.builds` is a solution
here. `st.builds(Foo, st.integers(), st.text(), st.booleans())` is the worse way to use it. As the `Foo` type has type
annotations hypothesis can infer the strategies with `st.builds(Foo)`. Default values are not inferred unless required
however, `d` would be left as  `None`.

```python
st.builds(Foo, d=hypothesis.infer)
```
is the tersest way to make a `Foo` and infer a value for the field with a default value.

Following [typeful development](/types-fp) we want to make illegal states unrepresentable (or impossible states
impossible). It's great if `st.builds(Foo)` always gives us a valid legal `Foo` but maybe we are relying on some
factory function to validate `Foo` construction, e.g. `def make_foo(...) -> Optional[Foo]` that returns an `Optional`
if the contructor throws a validation failure `ValueError`. Well hypothesis will error if it encounters a `ValueError`
when creating examples, so we have to supply a custom strategy.

For something simple like a latitude and longitude we can just provide appropriate parameters to the built in strategy
and maybe map the float to the new type.

```python
Longitude = NewType("Longitude", float)
Latitude = NewType("Latitude", float)

st_lat = st.floats(min_value=-90.0,
                   max_value=90.0).map(Latitude)
st_long = st.floats(min_value=-180.0,
                    max_value=180.0).map(Longitude)
```

If we did have a `make_foo` function that returns None on invalid examples we could use it inside a custom `composite`
strategy that can be used directly or given to `st.register_type_strategy` so that `st.builds` will only use a valid
strategy for `Foo`:

```python
@st.composite
def foo_strategy(draw) -> Foo:
    # pretending validation requires `a` to be even
    a = draw(st.integers().filter(lambda x: x % 2 == 0))
    b = draw(st.text())
    c = draw(st.booleans())
    d = draw(st.none() | st.floats().filter(...))
    foo = make_foo(a, b, c, d)
    assert foo is not None
    return foo

st.register_type_strategy(Foo, foo_strategy)
```

Of course, if we had a type with a validating constructor we could just call that directly within `foo_strategy`.
With fairly basic validation requirements it would also be easy to define a strategy once inline:

```python
foo_strat = builds(Foo,
                   a=st.integers().filter(lambda x: x % 2 == 0),
                   d=st.none() | st.floats().filter(...))
```

Composite strategies are the normal way to generate values with more linked up data - more internally structured
data, e.g. one field appearing in someway inside another one. Possibly more readable than calling `map`
on a strategy object aswell.

```python
SalesforceId = NewType("SalesforceId", str)

@st.composite
def salesforce_id_strat(draw) -> SalesforceId:
    uid = draw(st.uuids(version=4))
    return SalesforceId(str(uid))

# v.s.
salesforce_id_strat = st.uuids(version=4)
    .map(str).map(SalesforceId)
```

The `composite` decorator is convenient when building strategies that are inputs to other strategies on the way to
building a final value, though
[flatmap](https://hypothesis.readthedocs.io/en/latest/data.html#chaining-strategies-together) can be used for that if
you find it clearer for smaller strategies.

## Feedback Cycle

As implied earlier the definition of properties can positively feedback into the refinement of type constraints.

```python

class Bar:
    a: int
```

If `Bar` processing code has logic that treats negative numbers differently and then we find randomly generated
negative numbers are an annoyance, we may switch to making a `NonNegativeInt` new type for `a` and provide appropriate
upgraded validators and strategies for `Bar`. The logic has become simpler by refining the types and making negative
integers impossible state.

## Stateful Testing

Final new ideas, as this is a long post. Whilst property testing was created in a pure functional programming
environment, it can be used for stateful testing. We can use a strategy that generates random actions/instructions that
tell us what to do with an imperative stateful object. For example, add an item to a dictionary, try to remove one etc.
Hypothesis has [stateful testing support](https://hypothesis.readthedocs.io/en/latest/stateful.html) though I've not
tried it. I do have examples of stateful property testing in F# for testing a [mutable disjoint
set](https://github.com/enerqi/AlgorithmPad/blob/master/tests/Graphs.Tests/DisjointSetTests.fs) and [mutable heap
(priority queue)](https://github.com/enerqi/AlgorithmPad/blob/master/tests/Graphs.Tests/HeapTests.fs).

## Further reading

That's enough for an introduction, this F# [property testing
article](https://fsharpforfunandprofit.com/posts/property-based-testing-2/) gives advice on how to design property
tests, more than just some of the mechanics. Remember the benefit of property testing is that we test with lots of
values, common path or not, and use those tests to refine the value handling logic and/or constrain the types further
to work with all values in that type's set.
