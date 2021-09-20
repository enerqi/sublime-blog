---
title: Sublime Text IDE
date: "2021-06-09T06:45:03.284Z"
description: Using Sublime Text (4) as a Python/Rust IDE
---

The [Sublime Text](https://www.sublimetext.com/) editor announced its major v4 release recently, many years after v3. In the
last post about [low latency experiences](/noisy-machines/) I thought I would look into how Sublime does as an
IDE for Python or Rust.

[VSCode](https://code.visualstudio.com/) and [Intellij](https://www.jetbrains.com/idea/) (generic Intellij or
[Clion for Rust](https://www.jetbrains.com/clion/) and [Pycharm](https://www.jetbrains.com/pycharm/) for Python) are
the main IDE tools for these languages. Sublime text, like Vim, provides a joyfully fast and low latency
experience and is very good at setting up efficient movement and text slicing/dicing short cuts.

My experience is that Sublime does fine in place of Intellij or VSCode but there is more boilerplate to setup a project
that I can well imagine people not wanting to learn about when something more convenient is available. Sublime does not
have a good debugger for Python or Rust. The [sublime debugger package](https://github.com/daveleroy/sublime_debugger)
is a work in progress experience, at least on Windows. It is setup much like VSCode is for debugging, so VSCode's
debugging documentation will apply. For now, I'd be happy to jump into Pycharm or VSCode on the rare occasions I want to debug.

[Inlay hints](https://www.jetbrains.com/help/idea/inlay-hints.html) is a nice to have that VSCode and Intellij provide for Rust
but is missing from the current version of the Sublime LSP package. It's currently not standardised in the [LSP](https://microsoft.github.io/language-server-protocol/) spec.

Finally, Intellij/PyCharm has a wide array of refactorings. VSCode and Sublime can certainly highlight and
then rename symbols and VSCode has the minor refactorings "extract method/variable". Things like the "Move" refactor
could be worth firing up Intellij/PyCharm for when doing large scale refactoring.

## Typical Python Project

- [Black](https://github.com/psf/black) (code formatter)
- [Mypy](http://mypy-lang.org/) (type checker)
- [Flake8](https://gitlab.com/pycqa/flake8) (linter)
- Pytest
- Virtualenv (via [Pipenv](https://pipenv.pypa.io/en/latest/advanced/) to isolate project dependencies from other projects)

For VSCode we need to install the Python extension and then for each project the `.vscode/settings.json` looks
something like the following settings, after which it's all good to go:

```json
{
    "python.pythonPath": "C:\\Users\\MyUser\\.virtualenvs\\My-Project-6GvSyrI3\\Scripts\\python.exe",
    "python.linting.pylintEnabled": false,
    "python.formatting.provider": "black",
    "python.testing.pytestEnabled": true,
    "python.linting.flake8Enabled": true,
    "python.linting.mypyEnabled": true,
    "python.testing.pytestArgs": [
        "tests"
    ],
    "python.testing.unittestEnabled": false,
    "python.testing.nosetestsEnabled": false
}
```

For Sublime there are also somethings we need to do once (package setup) and other steps that are per-project. Use [package control](https://packagecontrol.io/)
to get these packages:

- [LSP](https://lsp.sublimetext.io/)
- LSP-json
- [LSP-Pyright](https://github.com/sublimelsp/LSP-pyright), which needs a [NodeJS](https://nodejs.org/) install
- SublimeLinter-contrib-mypy
- SublimeLinter-flake8
- [sublack](https://github.com/jgirardet/sublack)

I still tend to run tests using `pytest` in the terminal as using [Cmder](https://cmder.net/) integrated with
[Windows Terminal](https://github.com/Microsoft/Terminal) is nice. On Linux it's easy to manage terminals and
extra windows using the [i3 window manager](https://i3wm.org/). There is a
[pytest runner/viewer](https://packagecontrol.io/packages/PyTest) on package control though.


I have limited global LSP preferences (command: Preferences LSP Settings) that are agnostic of the particular LSP server:

```json
"lsp_format_on_save": true
```

The `lsp_format_on_save` setting is only revelant to Rust projects as the Pyright LSP server does not do formatting yet.
We use the `sublack` package for that instead. The `sublack` preferences cannot be reached via the command pallette so
use menu "Preferences -> Package Settings -> sublack" and set it to format on save:

```json
{
    "black_on_save": true
}
```

For sublime linter customise settings if desired (command -> "Preferences: Sublime Linter Settings").

We use the [flake8 linter](https://github.com/SublimeLinter/SublimeLinter-flake8) and [mypy linter](https://github.com/fredcallaway/SublimeLinter-contrib-mypy). Our
Python LSP server of choice, Pyright, does not have builtin mypy/flake8 support. There is a [different Python LSP server](https://lsp.sublimetext.io/language_servers/#python-lsp-server) with flake8 support, but it is based on Jedi/Rope and I've had a better experience
with the Microsoft Pyright typechecker which is used in Pylance and the VSCode Python extension. I've also used the
[Anaconda sublime package](https://packagecontrol.io/packages/Anaconda) for Python (and Rust) extensively. This supports
the mypy typechecker and flake8 directly. It also uses Jedi for completions and again, I think Pyright is a better experience.
Additionally, tools that are based around the [LSP](https://microsoft.github.io/language-server-protocol/) make it easy
for multiple editors to benefit from a single LSP server being updated, so seem to have more work on them. Maybe there will be a Pylance LSP server that sublime can use at some point. The global default config for these linters should
be fine. We don't worry about a global installation of mypy/flake8 as we are normally creating projects and using specific versions in that project for build reproducibility.

### Python Project Specific Setup

A typical sublime project file (use the command pallete or menu to create the project then edit it) now looks something
like this:

```json
{
    "folders":
    [
        {
            "path": ".",
        }
    ],
    "settings":
    {
        "python_interpreter": "C:/Users/MyUser/.virtualenvs/My-Project-6GvSyrI3/Scripts/python.exe",
        "SublimeLinter.linters.flake8.python": "C:/Users/MyUser/.virtualenvs/My-Project-6GvSyrI3/Scripts/python.exe",
        "SublimeLinter.linters.mypy.python": "C:/Users/MyUser/.virtualenvs/My-Project-6GvSyrI3/Scripts/python.exe",
        "PyTest": {
            "pytest": "C:/Users/MyUser/.virtualenvs/My-Project-6GvSyrI3/Scripts/pytest",
            "mode": "manual"
        },
        "sublack.black_command": "C:/Users/MyUser/.virtualenvs/My-Project-6GvSyrI3/Scripts/black"
    }
}
```

The LSP pyright server can be enabled globally or per project from the command pallette. The awkward part of using
Pyright is that a config file is required when it is used inside a virtualenv, which is almost always the case, so in the
project root we have `pyrightconfig.json` file that again needs the virtualenv path.

```json
{
    "venvPath": "C:/Users/MyUser/.virtualenvs/",
    "venv": "My-Project-6GvSyrI3",
    "pythonVersion": "3.8",
    "exclude": [
        "**/node_modules",
        "**/__pycache__",
        "**/.pytest_cache",
        "**/.mypy_cache",
        "**/.hypothesis"
    ],
    "useLibraryCodeForTypes": true,
    "typeCheckingMode": "off"
}
```

I prefer to leave most of the type warnings to `mypy`, in part because it's used in project continous integration builds,
but you can put the `typeCheckingMode` to "on" - see [pyright configuration](https://github.com/Microsoft/pyright/blob/main/docs/configuration.md).

## Typical Rust Project

Get the [Rust Enhanced](https://github.com/rust-lang/rust-enhanced) sublime package from package control. It's fine without customisation.

Use `rustup` to get the rust source code (probably already installed with rust) - `rustup component add rust-src`.

The rest is straight forward, follow the [sublime LSP instructions for Rust](https://lsp.sublimetext.io/language_servers/#rust).

In the sublime "Preferences: LSP Settings", in addition to the `"lsp_format_on_save": true` option mentioned above we add

```json
    "clients": {
        "rust-analyzer": {
            "enabled": true,
            "command": ["rust-analyzer"],
            "selector": "source.rust"
        }
    }
```

The `rust-analyzer.exe` binary (or just `rust-analyzer` on Linux) needs manually updating. UPDATE: the [LSP rust analyzer](https://github.com/sublimelsp/LSP-rust-analyzer) sublime package now handles this.

### Rust Project Specific Setup

With those global settings there shouldn't be need for project specific settings. The server provides formatting on save and linting.


## LSP Keyboard Shortcuts

Some shortcuts will make the LSP features easier to use.

```json
{"keys": ["ctrl+6"], "command": "lsp_symbol_references", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+6"], "command": "hide_panel", "args": {"cancel": true}, "context": [{"key": "panel_visible", "operator": "equal", "operand": true }]},
{"keys": ["ctrl+shift+6"], "command": "lsp_code_lens", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+7"], "command": "lsp_symbol_implementation", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+8"], "command": "lsp_symbol_type_definition", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+9"], "command": "lsp_symbol_declaration", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+n"], "command": "lsp_hover", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+n"], "command": "hide_popup", "context": [{ "key": "popup_visible", "operator": "equal", "operand": true}]},
{"keys": ["ctrl+alt+n"], "command": "new_file"},
{"keys": ["ctrl+r"], "command": "lsp_document_symbols", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+shift+r"], "command": "lsp_workspace_symbols", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+,"], "command": "lsp_symbol_definition", "context": [{"key": "setting.lsp_active"}]},
{"keys": ["ctrl+."], "command": "jump_back"},
```

We use LSP for goto commands instead of the builtin goto features. These shortcuts also put the `new_file` command on a different
key so `lsp_hover` is easily available (which is like quick documentation and more). Adjust for your setup.

## Overall

Definitely a bit of a hassle to setup, but nice once done. All customisations/settings for the dev environment and editor
should probably be under source control or saved somehow such as with the [Sync Settings](https://packagecontrol.io/packages/Sync%20Settings)
Sublime package.

Over the years I've seen a number of websites suggesting which Sublime packages to use that make the editor more like an IDE. My current large list is:

```json
[
    "A File Icon",
    "Advanced CSV",
    "AdvancedNewFile",
    "AlignTab",
    "ApacheConf",
    "AutoFileName",
    "AutoHotkey",
    "BracketHighlighter",
    "Browser Refresh",
    "Case Conversion",
    "ColorPicker",
    "Colorsublime",
    "ConvertToUTF8",
    "CSS Unminifier",
    "CUDA C++",
    "Debugger",
    "Dockerfile Syntax Highlighting",
    "EasyDiff",
    "EditorConfig",
    "Elixir",
    "Expand Selection to Whitespace",
    "F#",
    "FileBrowser",
    "FindKeyConflicts",
    "GDScript (Godot Engine)",
    "GitGutter",
    "GitHub Flavored Markdown Preview",
    "Gradle_Language",
    "Hasher",
    "HexViewer",
    "Highlight Build Errors",
    "HTML-CSS-JS Prettify",
    "i3 wm",
    "INI",
    "Inno Setup",
    "iOpener",
    "Jinja2",
    "JSX",
    "Julia",
    "Load file to REPL",
    "LSP",
    "LSP-json",
    "LSP-pyright",
    "LSP-rust-analyzer",
    "Markdown Extended",
    "MarkdownEditing",
    "MarkdownPreview",
    "Materialize",
    "Modific",
    "Monokai Extended",
    "MultiEditUtils",
    "NASM x86 Assembly",
    "nginx",
    "Package Control",
    "Path Tools",
    "PowerShell",
    "Protocol Buffer Syntax",
    "Puppet",
    "PureScript",
    "PyTest",
    "Python 3",
    "Random Everything",
    "requirementstxt",
    "Rust Enhanced",
    "Sass",
    "Select Quoted",
    "SelectUntil",
    "Shell Turtlestein",
    "SideBarEnhancements",
    "sublack",
    "SublimeLinter",
    "SublimeLinter-contrib-mypy",
    "SublimeLinter-flake8",
    "SublimeREPL",
    "Sync Settings",
    "Terminal",
    "TOML",
    "Trimmer",
    "TypeScript Syntax",
    "UnicodeMath",
    "Wrap Plus",
    "XSL",
]
```

Lots of those are just syntax highlighting for different languages.

These days there's a youtube channel [OdatNurd - Sublime Text Tutorials](https://www.youtube.com/channel/UCJAB_XF3kAMqwF85y0hxcXQ),
not just articles, to help you get the right personal setup. I have to
say, it's definitely easier than Emacs (and presumably Vim, though modal editing seems more the challenge than the
configuration). I spent 5 years using the text editor or operating system that is Emacs and read most of the entire
Emacs Wiki at one point. The amount of customisation and configuration code felt too much eventually and Emacs was
(still is?) single threaded, which can make for some annoying hangs. There maybe some out of the box emacs "distros"
that require little configuration, but I've long since stopped looking.
