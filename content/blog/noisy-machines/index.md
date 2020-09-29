---
title: Stable Low Latency Machines
date: "2020-09-25T14:16:03.284Z"
description: Low noise machines for performance testing and general positive user experience
---


Trying to do software performance testing on a noisy development machine can have challenges, especially when the
code under test uses multiple cores and the operating system or other processes wishes to use some of the CPU cores.
My Windows OS development setup was not quiet, enough so that I'm writing this. Dealing with noise and other latency
adding processes makes the machine overall much more responsive and pleasant to use.


## Windows Clean Up Scripts

Probably the noisiest thing about a Windows machine is just all the default services and background processes that are
running. There are various scripts that strip down a default Windows 10 install for
[privacy](https://www.privacytools.io/operating-systems/#win10) focussed
[reasons](https://www.oo-software.com/en/shutup10) and people have naturally combined these Windows 10 clean up scripts
in different ways. This [win10script](https://github.com/enerqi/win10script) that I forked on github does a good job of
turning off many services that are not necessary and uninstalling various bits of bloatware. It's also handy for
installing all the programs you want via the [chocolatey](https://chocolatey.org/) package manager on that new windows
install.

The most controversial tweak I made is turning off the real time anti-virus scanning. That was an annoyance, needing to
find the registry setting to edit as the scanning turns itself back on automatically otherwise. Development
environments like Intellij even offer to add your software project directories to the scanning exclusion list, so it's
clearly annoying some people. I might have ignored it and not noticed it except it was often the top CPU consumer in an
otherwise quiet system and more frustratingly it makes the Thunderbird email client really slow and stuttering even
whilst typing new messages (and still pretty slow after finding the Thunderbird play-nice-with-antivirus option).

A non-service related tweak was to disable all the animations/fades/delays in the "adjust the appearance and
performance of windows" options. Maybe overkill, but it's nice not to wait for animations when trying to get familiar
stuff done quickly. That's a similar tension that is seen between animation heavy web UI component libraries like Material UI and more snappier ones such as Bulma.

## simplewall

To control and reduce network traffic you could use something like [glasswire](https://www.glasswire.com/) but
[simplewall](https://www.henrypp.org/product/simplewall) works just fine and blocks all outbound traffic unless you
allow it (pop ups ask if you want to let the process start outbound traffic).


## Process priority and CPU Affinity

Running the process being performance tested with high scheduler priority may help a little. It's possible to get
some more performance consistency by limiting the process to certain CPUs so cached data is unlikely to jump around
to different L1/L2 CPU caches. By disallowing the process from using all the cores the operating system should have
a better idea to use those unused cores for other processes that may interrupt the process under test.

After struggling with the windows cmd.exe shell commands, I'd probably try with powershell and `Create-Process` /
`Set-Affinity` commands next time, but this one works well enough except you cannot Ctrl-C terminate the process (but
can use Ctrl+Break):

`start "Benchmark" /HIGH /AFFINITY 1F /WAIT /B path/to/executable`

The affinity is a bit mask as a hexadecimal number, one bit per logical cpu core, e.g. bits 1--12 for a 12 core CPU.

## Other Low Latency Experiences

Speeding up performance tests soon meant I wanted to remove any other sluggish tools on the system or to improve them.

The [Cmder](https://cmder.net/) command line console is very likeable in terms of features and fast once going, but it took ~5 seconds to open a new tab, for the sake of features that I don't use. One `/f` start up flag (see the windows
terminal config) and it's down to 1 second.

The new [windows terminal](https://docs.microsoft.com/en-us/windows/terminal/) is a nice modern GPU accelerated
terminal that works fine with [Cmder via a little config](https://github.com/enerqi/dotfiles/blob/master/AppData/Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json). It'll be even better when I can open a new tab as Admin instead of having to start a new terminal as Admin.

The [PowerToys](https://github.com/microsoft/PowerToys) project is mostly about small useful utilities, but the
`PowerToys Run` certainly seems quicker than the normal start menu when you know what you want.

There could be a side rant on the bloat of Electron based tooling like VSCode (though it's not that bad for what it
does). I'll certainly see how viable sublime text 4 will be (when it's released) as a python/rust programming editor
given how fast and low latency it is. [4Coder](https://4coder.itch.io/) is super fast but for C++ only (including
scripted in C/C++) at the moment and in Beta, still planning to add Rust support later.

[Sublime Merge](https://www.sublimemerge.com/) is certainly a low latency nice git client, but whether people can be
tempted to use a client outside of their IDE or just use the command line, it's hard to say.

Opening PDFs barely seems worth mentioning, but in the past Adobe has always been very slow and bloated. I've been
using [SumatraPDF](https://www.sumatrapdfreader.org/free-pdf-reader.html) for years now. Fast software should do the
job (read PDFs) and nothing more.
