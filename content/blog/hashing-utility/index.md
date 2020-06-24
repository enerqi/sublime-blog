---
title: File Hashing Utility in Python and Rust
date: "2020-05-23T19:45:03.284Z"
description: Rust will be faster right?
---

There is a `Get-FileHash` cmdlet in powershell on windows and I'm sure this would be easy using the CLI on Linux.
Regardless, here's two programs in Python and Rust to generate a few different hashes of a file, for whatever file
integrity checking needs you have.

```python
import hashlib
import sys

args = sys.argv[1:]
if args:
    filename = args[0]
else:
    filename = input("Enter the input file name: ")

with open(filename,"rb", buffering=0) as f:
    READ_SIZE_BYTES = 64 * 1024

    md5_hash = hashlib.md5()
    sha1_hash = hashlib.sha1()
    sha256_hash = hashlib.sha256()
    sha512_hash = hashlib.sha512()

    for byte_block in iter(lambda: f.read(READ_SIZE_BYTES), b""):
        md5_hash.update(byte_block)
        sha1_hash.update(byte_block)
        sha256_hash.update(byte_block)
        sha512_hash.update(byte_block)

    print(f"md5 hex digest: {md5_hash.hexdigest()}")
    print(f"sha1 hex digest: {sha1_hash.hexdigest()}")
    print(f"sha256 hex digest: {sha256_hash.hexdigest()}")
    print(f"sha512 hex digest: {sha512_hash.hexdigest()}")
```

Optimizing the read size can be interesting. The `file.read` will, after being interpreted by python, resolve to  making a system call, i.e. the `read` system call. Blocking on this call that switches to the privileged kernel mode
(instead of user space code) and retrieves the specified amount of data from the file is not free, it has relatively
high latency. That's why libraries for every language provide some sort of I/O buffering, buffers that exist outside
of the kernel space that are used to read relatively large chunks.

In python buffering is on by default and if you wanted to turn it off just pass `buffering=0` to `open`. In other
languages the buffering is more in your face, with BufferedReader objects wrapping file streams/objects. With the
buffering on even if we read 1 byte at a time from the file we wouldn't be making one system call per byte to the
operating system.

```python
import io
io.DEFAULT_BUFFER_SIZE
```

Shows that the default buffer size is 8KB. As we are reading large chunks we can disable
buffering that we are not benefiting from. Binary buffered objects use locks to be thread safe, so that's another
overhead to remove by disabling it.

```shell
Measure-Command { python hash-a-file.py test-file }
```

Some adhoc repeated measuring of progam run time in Powershell clearly shows a quite heavy slowdown when artificially
increasing the IO buffer size e.g. `buffering=512*1024`. In terms of different `READ_SIZE_BYTES` sizes, some quick
reading suggests that on windows at least I/O requests at the kernel level max out at 64KB chunks, though that doesn't mean there isn't benefit to staying in the kernel space and doing a batch of I/O operations before coming back to user
space code. Then there's the in-memory file cache, which will show different behaviour. Reading from the file cache
I expect that the optimal size will depend on CPU cache sizes and other activity on the system.

Running only the more lightweight md5 hash the runtime for hashing a large 915MB file goes from ~0.4s (no hash) to
~2.0s, so the CPU activity is significant. I/O does play its role though:

| Read Size   |      Hash Time 915MB File |
|----------|:-------------:|
| 4KB |  ~2.75s |
| 8KB |  ~2.3s   |
| 64KB | ~1.95s |

Larger buffers than 64KB seemed to help a little but variance was high. Hardly a proper benchmark but somewhat informative.


```rust
use std::{env, fs::File, io::Read, io::Error, path::Path};
use md5::{Md5, Digest};
use sha1::{Sha1};
use sha2::{Sha256, Sha512};
use sha3::{Sha3_256, Sha3_512};

struct HexDigest(String);
#[derive(Debug)]
enum DigestType {
    MD5,
    SHA1,
    SHA2_256,
    SHA2_512,
    SHA3_256,
    SHA3_512,
}
const DIGESTS_TYPES_COUNT: usize = 6;

fn hash_file(file_path: &Path) ->
    Result<[(DigestType, HexDigest);
            DIGESTS_TYPES_COUNT], Error> {

    let mut file = File::open(file_path)?;

    let mut md5_hasher = Md5::new();
    let mut sha1_hasher = Sha1::new();
    let mut sha256_hasher = Sha256::new();
    let mut sha512_hasher = Sha512::new();
    let mut sha3_256_hasher = Sha3_256::new();
    let mut sha3_512_hasher = Sha3_512::new();

    const BUF_SIZE_BYTES: usize = 64 * 1024;
    let mut byte_buffer = vec![0; BUF_SIZE_BYTES];
    loop {
        let n = file.read(&mut byte_buffer)?;
        let valid_buf_slice = &byte_buffer[..n];
        md5_hasher.input(valid_buf_slice);
        sha1_hasher.input(valid_buf_slice);
        sha256_hasher.input(valid_buf_slice);
        sha512_hasher.input(valid_buf_slice);
        sha3_256_hasher.input(valid_buf_slice);
        sha3_512_hasher.input(valid_buf_slice);
        if n == 0 {
            break;
        }
    }

    let sha1 = HexDigest(format!("{:x}",
                                 sha1_hasher.result()));
    let md5 = HexDigest(format!("{:x}",
                                md5_hasher.result()));
    let sha256 = HexDigest(format!("{:x}",
                                   sha256_hasher.result()));
    let sha512 = HexDigest(format!("{:x}",
                                   sha512_hasher.result()));
    let sha3_256 = HexDigest(format!("{:x}",
                                     sha3_256_hasher.result()));
    let sha3_512 = HexDigest(format!("{:x}",
                                     sha3_512_hasher.result()));

    Ok([
        (DigestType::MD5, md5),
        (DigestType::SHA1, sha1),
        (DigestType::SHA2_256, sha256),
        (DigestType::SHA2_512, sha512),
        (DigestType::SHA3_256, sha3_256),
        (DigestType::SHA3_512, sha3_512),
    ])
}


fn main() -> Result<(), Error> {

    let args: Vec<String> = env::args().skip(1).collect();
    for file_path_arg in args {
        let hex_digests = hash_file(Path::new(&file_path_arg))?;
        println!("Hexadecimal digests (secure hashes) for {}:",
                 file_path_arg);
        for (digest_type, digest) in &hex_digests {
            println!("\t{:?} hex digest: {}",
                     digest_type, digest.0);
        }
    }

    Ok(())
}
```

Rust has a BufferedReader (`BufReader`), but again we don't want buffering as we are reading in large chunks. Files in
Rust don't have a text or binary opening mode distinction (the `BufReader` provides text based `read_line` and `lines`
iterator). There's probably a library somewhere with a chunk reading iterator that would make reading binary data look
less low level. It's basically the same as the python program, except for allowing multiple files to be hashed in one
call to the program and adding few more hash types.
As there is no garbage collection, it's fully natively compiled and has no virtual machine startup overhead it should
just be faster. The build configuration in the `Cargo.toml` file was tweaked for max performance `lto=true`
(link time optimization) and `codegen-units = 1` (less parallel codegen so code can be optimized in a larger context
instead of smaller chunks).

```toml
[package]
name = "hash-file"
version = "0.1.0"
edition = "2018"

[dependencies]
md-5 = "^0.8"
sha-1 = "^0.8"
sha2 = "^0.8"
sha3 = "^0.8"

[profile.release]
lto = true
codegen-units = 1
```

So for a 915MB input file the python program was running just the sha2-256 hash in ~3 seconds. The rust program was
doing the same in ~6 seconds. Yeah, twice as slow and I double checked that the time was being spent in the library
hashing function. Actually a significant improvement was had by compiling the Rust program to target the CPU of the
machine it's running on, instead of some generic x64 processor, so we can use processor specific instructions like AVX.
More of a hidden option set in the `.cargo/config` file:

```toml
[build]
rustflags = ["-C", "target-cpu=native"]
```

That puts it within 50% of the python program, but still slower. Just goes to show that Python maybe a very slow
interpreted language by most benchmarks, but a lot of the time Python is used as a scripting language for native code,
i.e. C/C++/Rust libraries. In this case the hashlib implementation in the Python standard library is clearly better
optimized than the third party rust libraries.
