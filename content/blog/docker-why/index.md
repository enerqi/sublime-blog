---
title: Docker
date: "2020-02-01T18:12:03.284Z"
description: "Is Docker great or too much?"
---

I've been using [Docker](https://www.docker.com/) for about 3 years now and it certainly is convenient for deploying software artifacts in a consistent way.
There's a large [public registry](https://hub.docker.com/) of images and the tools are easy enough to use for building
your own images. It does feel very Linux centric, but if you are creating software services they are probably going to
be deployed on Linux and you can develop on Windows with it well enough thanks to [Hyper-V](https://en.wikipedia.org/wiki/Hyper-V)
and the Windows Subsystem for Linux [WSL](https://docs.microsoft.com/en-us/windows/wsl/) that has also come a long way.

## Virtual Machines versus Containers

Years before it would have been bare-metal or virtual machines. Virtual machines are still strictly required
if you want to use a different operating system kernel. Containers, which are runnable (docker) images, use
operating system kernel features (e.g. cgroups, namespaces, union file system on Linux) to isolate processes. However,
all the processes, regardless of what container they are in, use the same operating system kernel - so we still need a
virtual machine to run a kernel different to the one on the bare metal hardware.

Software running in virtual machines, especially virtual machines running on a host that is specifically configured to be a VM host (see Type-1 [Hypervisor](https://en.wikipedia.org/wiki/Hypervisor)), can run just as fast as on bare metal
for user space code. There can be some overhead when making privileged operating system calls (["Syscalls"](https://en.wikipedia.org/wiki/System_call)). Syscalls are involved in common operations like reading/writing to files
and network sockets. Syscall heavy code can suffer more on VMs. High performance applications have always tried to
reduce the number of syscalls made. Mitigations to recent vulnerabilities (e.g [Spectre/Meltdown](https://meltdownattack.com/))
in CPUs has also decreased the performance of some syscalls. Regardless, syscalls is not what made people go to containers from virtual machines - if you were that concerned with performance you might just be running on bare metal
machines.

VMs have a much greater startup time and more memory resources are required just to have the VM idling. They can be
underprovisioned and at startup not given all the physical memory that the guest VM believes it has, but the base
memory requirement is just greater - after all it is running another full operating system instance. Containers also don't have the hypervisor overhead, but I think the startup time
and smaller resource requirements, especially memory, is what make containers more appealing than virtual machines.
That said, virtual machines are often still used in conjuction with containers.

## Containers Solve What Exactly?

Containers are often orchestrated with [Kubernetes](https://kubernetes.io/). Did we ever need containers in the first
place though? If we are going to have a complicated orchestration layer, why orchestrated containers and not
something else orchestrated?

It's interesting to note that the Solaris operating system had "zones" 15
years ago and jails were introduced to the FreeBSD operating system 20 years ago. As Apple operating systems are BSD
derivatives (BSD doesn't used the GPL license so it can be commercially used) we've seen "jails" in Apple products and
heard of people "jail-breaking" their iphones etc. Basically, Linux was much later to the container party, but it's
the developer friendliness of the tooling and the defacto standardisation around things like docker container images
that has really helped it become popular. Initially there was resistance to them due to security issues in the implementation of all the isolation features in the (Linux) kernel. Jails have been hardened for a long time but never
became popular.

Ok, so what have containers provided and in what ways is the actual problem solvable by older or simpler solutions?

#### Process isolation

Isolating a process in itself doesn't seem anything new. [Sysctls](https://en.wikipedia.org/wiki/Sysctl) can be set
that control how much visibility a process has of other processes by default. We've been able to group things with users and
groups on Linux since the start. There's no reason why orchestration software couldn't make this convenient, but docker
is making it convenient to use on the developers' machines where grand orchestration software is not wanted.

[Chroot](https://en.wikipedia.org/wiki/Chroot) to change a process's filesystem view has been around for a long time,
but you'd probably want to run it as a different user (at which point your default sysctl settings might mean it
cannot see other processes). Still it's quite low level and docker makes it convenient and automatic.

#### Process resource controls

This is a lower level concept than what we normally think about when running containers in development, but docker
for example, certainly does provide conveniences to control
resources such as memory and cpu usage. Docker will use the OS features such as [Cgroups](https://en.wikipedia.org/wiki/Cgroups). As a form of higher level tooling docker is doing fine here, but developers rarely care about resource controls,
it's more for operations where resources will be controlled via some other orchestration means.


#### Software dependency isolation

Using a docker image, which employs [UnionFS](https://en.wikipedia.org/wiki/UnionFS) to layer filesystems on top of
one another into one final filesystem image, we can guard against dependency/version clashes between different
software artifacts. For example, a python web service may require version 1 of some library and another python web
service needs version 2. Maybe a whole new filesystem image is overkill though?

[Nix](https://nixos.org/nix/) is a purely functional Linux package manager and each package and version of that package has its own unique subdirectory. Every package should provide complete dependency specifications so that there
is no hidden dependency on globally installed libraries (e.g. dlls / shared objects).

Statically compiled binaries is a simple alternative instead of relying on shared dynamic libraries. Some newer
natively compiled programming languages such as Golang and Rust default to building static binaries - they are easy to
copy to some other machine and just run (if it's the correct executable format). Cross-compilation (compiling for different hardware architectures) is not new. Even some heavier virtual machine
based languages such as C# on .NET can be AOT (ahead of time) compiled so that no .net runtime need be pre-installed (globally) or compiled along with a copy of the runtime.


#### Networking

This could fall under process isolation. Network namespacing features allow a dedicated network stack to be provisioned.
Again, maybe not necessary as we could provision different IP aliases so that different applications have their own
IP address which means they won't have port conflicts. Different containers can be given different hostnames, but then
so can different IP aliases. This could complicate the wider LAN though with more IP addresses being used by a single physical machine.


Looking back on these thoughts, I don't think I'll be running from Docker anytime soon, but I do wonder if all those
file system layers couldn't be simplified. At least it's standardized and repeateable even if it might be over complicated.
