---
title: Rust Compilation Speed
date: "2021-11-17T10:12:03.284Z"
description: "Compilation Options and Iteration Times"
---

Some notes on rust compilation options and the effect on compile times of a moderate sized rust application (5000 lines). This looks at tweaking options in `.cargo/config` aswell as the `Cargo.toml` file.

An example `.cargo/config` file:

```ini
[build]
rustflags = ["-C", "target-cpu=native"]
rustc-wrapper = "sccache"

[target.x86_64-pc-windows-msvc]
linker = "rust-lld.exe"

[target.x86_64-unknown-linux-gnu]
linker = "/usr/bin/clang"
rustflags = ["-Clink-arg=-fuse-ld=lld"]

[profile.dev.package."*"]
opt-level = 3
```

These tests run in the following environment:

- Rust v1.55, CPU 12 core Ryzen 5900x, RAM 32GB, NVM SSD
- Using the faster `lld` linker unless specified
- Using the `target-cpu=native` option
- Dependencies are already downloaded, so only looking at compiling/linking time
- Debug `opt-levels` only apply to *third party* code to help compile iteration times


## Full Rebuild Performance

| Options                                                             |  Time  |
|:--------------------------------------------------------------------|:------:|
| Debug + sccache second run, opt-level 0, debug = 0                  | 0m.25s |
| Debug + sccache second run, opt-level 0, debug = true               | 0m.31s |
| Debug, opt-level 0, debug = 0                                       | 0m.34s |
| Debug, opt-level 0, debug = 1                                       | 0m.36s |
| Debug, (default) opt-level 0, debug = true                          | 0m.39s |
| Debug + sccache first run, opt-level 0, debug = 0                   | 0m.49s |
| Debug + sccache second run, opt-level 3, debug = 0                  | 0m.52s |
| Debug + sccache first run, opt-level 0, debug = true                | 0m.59s |
| Debug, opt-level 1, debug = 0                                       | 0m.59s |
| Debug, opt-level 1, debug = 1                                       | 1m.03s |
| Debug, opt-level 1, debug = true                                    | 1m.11s |
| Debug + default linker + sccache second run, opt-level 3, debug = 0 | 1m.12s |
| Debug, opt-level 3, debug = 0                                       | 1m.15s |
| Debug, opt-level 3, debug = 1                                       | 1m.17s |
| Debug, opt-level 3, debug = true                                    | 1m.31s |
| Debug + sccache first run, opt-level 3, debug = 0                   | 1m.51s |
| Release + sccache second run, codegen-units = 16, lto = thin        | 0m.50s |
| Release, (default) codegen-units = 16, lto = false                  | 0m.59s |
| Release, codegen-units = 16, lto = thin                             | 0m.59s |
| Release, codegen-units = 1, lto = false                             | 1m.18s |
| Release + sccache first run, codegen-units = 16, lto = thin         | 1m.28s |
| Release, codegen-units = 1, lto = thin                              | 1m.32s |
| Release + sccache second run, codegen-units = 16, lto = true        | 1m.47s |
| Release + sccache second run, codegen-units = 1, lto = thin         | 2m.13s |
| Release + sccache first run, codegen-units = 16, lto = true         | 2m.15s |
| Release, codegen-units = 1, lto = true                              | 2m.02s |
| Release + sccache second run, codegen-units = 1, lto = true         | 2m.12s |
| Release + sccache first run, codegen-units = 1, lto = thin          | 2m.13s |
| Release + sccache first run, codegen-units = 1, lto = true          | 2m.57s |


- Debug can full rebuild slower than Release mode, `incremental` compilation is off by default for Release, but it's still surprising
- `debug` levels of `0` and `1` (line number tables only) are similar, default full debug `true` is clearly slower (but actually useful in a debugger)
- The `lto` (link time optimization) option has more performance per compile time than decreasing `codegen-units` units (lower parallelism creates faster code/slower compile due to more optimisation context given to that codegen unit).
- The `lto = thin` setting can be almost as fast as the less optimized no `lto`
- With `lto` set to `true` or `full` it globally optimizes every crate in the binary, so can be heavy on RAM usage and doesn't scale well with project size
- Using [sccache](https://github.com/mozilla/sccache) may pay off for repeated full rebuilds, especially if you have a fast storage device to access the 10GB shared compilation cache. It works across
projects and local build cleans.  It's less important for incremental compilation / iteration.
- `sccache` is not that fast with the default linker on Windows - use the faster `lld` linker.
- Looking at sccache stats `sccache -s` shows that there are some cache misses when `incremental` compilation is used (default in debug) and depending on the crate type, it's just not cacheable
- `sccache` did *not* help release build with low `codegen-units`, so unless it's your final optimized release build prefer the default `codegen-units`

## Incremental Build Performance

Running `cargo build` after editing a string in the source code. If you just need to know if the code is correct you can run `cargo check`, which is much quicker, but your editor/IDE is probably already doing that.

| Options |                                            | Time  |
|:-----------------------------------------------------|:-----:|
| opt-level 3, debug = 0                               | 2.45s |
| sccache + opt-level 3, debug = 0                     | 2.5s  |
| sccache + opt-level 1, debug = 1, target-cpu=generic | 2.75s |
| opt-level 3, debug = 0                               | 2.78s |
| sccache + opt-level 3, debug = 1                     | 2.8s  |
| sccache + opt-level 1, debug = 1                     | 2.8s  |
| default linker + sccache, opt-level 3, debug = 1     | 3.00s |
| default linker, opt-level 3, debug = 1               | 3.02s |
| default linker + sccache, opt-level 1, debug = 1     | 3.02s |
| default linker + sccache, opt-level 1, debug = 1     | 3.04s |
| sccache + opt-level 3, debug = true                  | 3.5s  |

Apart from ensuring we are using the `lld` linker the main speed up comes from reducing the debug level. If you can get
by with line numbers only for symbols then `debug = 1` instead of the default `debug = true` is a good idea.

## Debug Code Performance

As mentioned, debug `opt-level`s are only applied to *third party* code to help compile iteration times. Opt level 0 is
the default level for the dev profile with up to level 3 being full optimizations. Level 2 will unroll loops,
potentially making debugging confusing. Level 3 does more vectorization and inlining. When using a debugger consider going to `opt-level` `0` or `1`.

