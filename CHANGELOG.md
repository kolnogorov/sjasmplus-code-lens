# Changelog

## 0.1.10
- Fixing file associations no longer leaves an entry like `"*.{s,-----…}": "asm-z80-sjasmplus"` behind when NASM Code Lens is not installed: what remains of its glob after `asm` and `inc` are taken out is removed too (it would only open `.s` files as plain text). The same if nothing but its filler of dashes remains. With NASM Code Lens installed the rest stays, it is its `.s` files. An entry that an earlier version left stays: remove it by hand if you don't use NASM Code Lens.

## 0.1.9
- NASM Code Lens (ASM Code Lens 3.x) took the assembler files and the extension did nothing, without a word. On its first start it writes `"*.{asm,inc,s,nasm,yasm,-----…}": "asm-x86-nasm"` to `files.associations`; VS Code takes the longest matching entry, so it wins over `"*.asm": "sjasmplus"`, and after NASM Code Lens is uninstalled the files open as plain text. Globs of several extensions (`*.{asm,inc}`) are now recognized, and which entry wins is decided as in VS Code. The fix takes our file types out of such a glob where it is defined ("Everywhere") or overrides it in the workspace settings ("In this workspace"). The question also comes when a file opens in another language because of the settings, e.g. after another extension changed them.
- Folding: an `IF` block (or any other block) with a label right below its first line folds again. The region of the label above ended on the `IF` line and the region of the label in the block went past `ENDIF`; VS Code drops a range that overlaps another without nesting, here the block. A label now folds up to the next label within the block it is in, and before a block it would not contain completely.
- This extension is the default formatter of sjasmplus files (`"[sjasmplus]": {"editor.defaultFormatter": ...}`): formatting works without choosing a formatter, also when `editor.defaultFormatter` names another extension.
- DeZog: during a debug session the context menu of sjasmplus files and listings has DeZog's items Move Program Counter to Cursor, Disassembly at Cursor and Analyze at Cursor. DeZog shows them only for its own language (`asm-collection`).

## 0.1.8
- Code label or data (semantic colors, outline, completion): the kind of a label follows the first statement after it that assembles something, not only a directive on its own line. A label on its own line above `db`, a label in front of a macro call whose body emits `db`, and labels in front of `INCBIN` are data now. Comments, empty lines, other labels and directives that emit nothing (`IF`, `DUP`, `DISPLAY`, …) are skipped; `ORG`, `ALIGN`, `INCLUDE` and the like end the search. The rule is described in the README.
- Labels made of a macro parameter (`tag_exit` in `MACRO decode tag`, invoked as `decode gb`) are defined for each expansion under the name sjasmplus gives them (`gb_exit`). A use of such a name outside the macro, also before the invocation, is no longer reported as "Label not found". Go to definition leads to the label in the macro and the reference count above it includes the uses of the expanded names. The arguments are bound by position; the parameter replaces the whole name and, unless `OPT --syntax=...s` is in effect (`OPT push`/`pop`/`reset` are followed), sub-words delimited by underscores, as in sjasmplus (`my_arg_x` with the parameter `my_arg`). An argument in angle brackets (`<gb>`) is the text inside. Arguments that cannot be part of a name are ignored. Such names are not renamable (rename would change the uses but not what the macro makes), hover says "Made by a macro expansion".
- `IF EXIST label`, `IFN EXIST label` and `ELSEIF`: the tested label may be absent, so it is not reported, and neither are its uses in the blocks of the condition (including `ELSE`), until `ENDIF`. Other undefined labels in those blocks are still reported.

## 0.1.7
- `INCLUDE` with a define instead of the file name (`DEFINE MAIN_FILE "main.asm"` … `INCLUDE MAIN_FILE`) is followed like sjasmplus does. Before, the file was not found: its defines and macros were missing there, so `IFDEF` blocks were dimmed and macro calls reported as "Label not found". The same for `INCBIN` and other file directives (the define counts as referenced).

## 0.1.6
- `DEFINE+` and `DEFARRAY+` were not recognized as defines, so `IFDEF` of such a name was dimmed.
- After an `INCLUDE` that is not found (e.g. the include path is missing in `includePaths`), `IFDEF` of a name that the project defines somewhere is no longer dimmed: the missing file may define it.

## 0.1.5
- Hex numbers like `#4000` or `#FF0000` are no longer shown as colors with a color picker in sjasmplus files and listings (`editor.colorDecorators` is off for these languages by default).

## 0.1.4
- IFDEF blocks were dimmed when the define was in another file, in two cases: the file is included by several programs and only one of them defines the name (now a line is dimmed only if no program assembles it), or the INCLUDE was not found (e.g. a missing include path), so the file was analyzed on its own (now IFDEF of a name that the project defines somewhere is not dimmed there).

## 0.1.3
- Other extensions for `.asm` (DeZog, Z80 Macro-Assembler, Z80 Assembly) could take the assembler files, and the extension did nothing. Now it notices such a file and offers to associate the files with sjasmplus; "Check file associations" also reports these extensions.
- The extension also activates when an assembler file opens in one of these languages (e.g. a single file without a folder).
- Breakpoints can be set in sjasmplus files and listings (DeZog only enables them for its own list of languages).

## 0.1.2
- Telegram chat for questions and discussion: https://t.me/sjasmpluscodelens (README, Q & A link on the Marketplace).

## 0.1.1
- README: getting started, how to use each feature, all settings and commands, limitations.

## 0.1.0
- Forked from [ASM Code Lens](https://marketplace.visualstudio.com/items?itemName=maziac.asm-code-lens) 2.6.3 by maziac.
- Language ids are now `sjasmplus` and `sjasmplus-list`, settings and commands use the `sjasmplus-code-lens.` prefix.
- Listing files: `.lst` added. Sources: `.s` is no longer associated.
- Markdown code blocks: ```` ```sjasmplus ```` and ```` ```z80 ```` are recognized besides ```` ```asm ````, and ```` ```sjasmplus-list ```` besides ```` ```list ````.
- Removed the donation prompts and the "What's New" page.
- Syntax highlighting rewritten for sjasmplus 1.24: all directives (also with a leading dot) and their argument keywords, documented and undocumented Z80, Z80N and CSpect instructions, all number formats, labels by kind (local, `@`, `!`, temporary, SMC offsets), macros and struct instances, nested block comments, Lua blocks. Keywords of other assemblers (x86, RASM, Game Boy, ...) are gone. The listing grammar follows the real sjasmplus listing columns.
- Typing `af'` no longer inserts a second apostrophe.
- New symbol index instead of the regex search: sources are parsed and walked from the main files through `INCLUDE`s with the sjasmplus rules for modules, local, `@` and `!` labels, structs and struct instances, macro expansion, temporary labels and defines. All features (code lens, definition, references, rename, hover, completion, outline, workspace symbols, unreferenced labels) use it.
- Rename changes only the part of qualified names that belongs to the renamed symbol; modules can be renamed too.
- Folding for `DUP`/`REPT`, `WHILE`, `IF` and `LUA` blocks.
- New settings `includePaths` and `dirbol`; `labels.colon` and `labels.excludes` are removed (no longer needed).
- Features also work for files outside of a workspace folder.
- Formatting ("Format Document", "Format Selection") that adapts to the style of each file: instruction and directive columns, nested code, trailing comments per group of lines; options for keyword case, commas and operand spacing.
- Completions open when typing '.' (local labels, module members).
- Problems for labels that are not defined; IFDEF/IFNDEF blocks that are not assembled are evaluated and dimmed; new setting `defines` for command line defines.
- Semantic highlighting from the symbol index.
- Defines and labels created by Lua (`sj.insert_define`, `sj.insert_label`) are known.
- Offers to fix "files.associations" that send assembler files to another language (e.g. ASM Code Lens 2); commands "Check file associations" and "Associate assembler files with sjasmplus in this workspace".
- Faster re-indexing.
- Fixed: every settings change re-registered all providers, which could drop requests that were in flight.
