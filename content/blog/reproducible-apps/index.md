---
title: Reproducible Software
date: "2020-06-07T19:45:03.284Z"
description: Minimum Consistency Standards
---

Reproducible software needs reproducible builds and reproducible host environments. Even for hobby software projects
I hope most of what follows is in place, for your own sanity. It works on my machine, but not yours or on the build
server / continuous integration server but not staging are hopefully becoming rarer sayings. This should be
easier for controlled server side software in comparison to user desktop environments where anything
could be installed.

Customising software per deployment is the role of configuration and can be done in a language and operating system
neutral way through environment variables. As this is per deployment by design, and in some sense deliberately not
meant to be reproduced the same way on different hosts, it is therefore by definition not about making strictly
reproducible software.


## Reproducible Builds

When doing CI builds of software (with Gitlab, Travis, Appveyor or others) we want:

- the same source files every time we ask for them
- the same libraries to be used all the time unless specified exactly for different environments like Windows vs Linux
- the same runtime used for the program

Typically we want to run various quality checks of the software as well:
- tests
- linters (idioms, styles, formatting, security)
- type checking
- smoke test of the running software without any development/testing tools installed

The same source files should be covered by the use of source control, such as `git`. If this is not in place then you
have a huge problem and an easy place to start improving things.

For Python we can use tools like `pipenv` to create virtual environments with the python runtime free of python
libraries installed by other projects. It will install the exact versions of libraries that we specify from the
`Pipfile.lock`. The exact runtime used might be part of the OS environment setup. For example, `pipenv` specifies a
major+minor version of python but not an exact version and that could even vary by OS.

`flake8` is a popular general linter, `bandit` is an example of a security linter and `safety` can audit the packages
installed the virtual environment for security vulnerabilities. `black` is an example tool that can format code to a
common style (if you like that sort of thing). Finally, even Python has some type checking via the `mypy` tool.

Most languages have such tools these days.


## Reproducible Environments

A repeatable setup extends to the operating system setup, what is installed, what files exist and how the OS is
configured. There are various options these days, `docker` is a popular one for server side software. The script in
the docker file can install your reproducible software build in a particular consistent OS environment. This could
also be done with scripts, such as `ansible`, running on a clean OS image in a virtual machine.

The environment configuration may mean running reproducible builds of other applications or libraries used. It may
just mean using existing tools to install specific versions of things like `postgresql`, your database.


## Reproducible Infrastructure

Combining configuration with automation is beyond the basic reproducible environment idea. Infrastructure as code is
more likely to be a devops / systems admin concern and is about making all those reproducible environments work
together as one larger often multi-host system. A concern for both development and operations will be the existence
of observability aides - logging, tracing and metrics, with logging being the obvious one to focus on first.
