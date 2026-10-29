# sjasmplus Code Lens

A Visual Studio Code extension for Z80 assembly written for [sjasmplus](https://github.com/z00m128/sjasmplus), aimed mainly at ZX Spectrum development. It understands your project the way sjasmplus does: modules, local labels, structs, macros, `INCLUDE`s. So reference counts, navigation and renaming are exact, not a text search.

> **Status:** preview. Questions and discussion in the [Telegram chat](https://t.me/sjasmpluscodelens), bug reports and ideas in the [issues](https://github.com/kolnogorov/sjasmplus-code-lens/issues).

## Features

- Syntax highlighting for sjasmplus sources and listing files, also in Markdown code blocks
- Code lenses with the number of references above labels, constants, structs, struct fields, macros and defines
- Go to Definition, Find All References, Rename
- Hover with the comments above a definition
- Completions of labels, local labels, macros, defines, instructions and directives
- Outline view, breadcrumbs, "Go to Symbol in Workspace"
- Problems for labels that are not defined ("Label not found")
- `IFDEF`/`IFNDEF` blocks that are not assembled are dimmed
- Semantic highlighting: code labels, data, constants, structs, fields, macros, defines and modules in their own colors
- Formatting that adapts to the style of each file
- Code folding, "Find Labels with no Reference", a hexadecimal calculator

## Getting started

1. **Open the folder of your project** (File > Open Folder), the folder you run sjasmplus in. The extension indexes all sjasmplus files of the folder.
2. **Check the language.** Files ending in `.asm`, `.a80`, `.z80` and `.inc` open as *sjasmplus*, listings (`.lst`, `.list`, `.lis`) as *sjasmplus listing*. The language is shown on the right of the status bar; click it to change it for a file. Other assembler extensions (DeZog, Z80 Macro-Assembler, ASM Code Lens) claim `.asm` too, and VS Code may give the files to them: then this extension stays silent. It notices that and offers to associate the files with sjasmplus, see [Other assembler extensions](#other-assembler-extensions).
3. **Tell it about your build**, if needed, in `.vscode/settings.json` of the project:

   ```jsonc
   {
       // INCLUDE paths given to sjasmplus with -i / --inc (the project folder is always searched)
       "sjasmplus-code-lens.includePaths": ["lib", "${workspaceFolder}/../common"],
       // Defines given with -D, so IFDEF blocks are evaluated like in your build
       "sjasmplus-code-lens.defines": ["_DEBUG_"],
       // Folders that are not part of the project (old code, other assemblers)
       "sjasmplus-code-lens.excludeFiles": "**/{old,_archive}/**"
   }
   ```

   If you build with `--dirbol`, also set `"sjasmplus-code-lens.dirbol": true`.

That's it: open a source file and the reference counts appear above the labels.

## How to use it

The key bindings are the defaults of VS Code on Windows and Linux.

| What | How |
|---|---|
| See where a label is used | Click the "N references" above it, or Shift+F12 |
| Go to a definition | F12 or Ctrl+click. On `vdp.Cls` a click on `vdp` goes to the module, on `Cls` to the label. On an `INCLUDE` line it opens the file. On a struct instance field (`pos.x`) it shows the instance and the field of the struct. |
| Peek a definition | Alt+F12 |
| Rename a label, struct, field, macro, define or module | F2. Only the part of each name that belongs to the symbol changes: renaming `clear` in module `util` turns `util.clear` into `util.cls` and `util.clear.fast` into `util.cls.fast`. |
| Read the description of a routine | Hover the label: the comment lines above the definition are shown |
| Complete a name | Ctrl+Space. Typing `.` lists the local labels of the current routine, `module.` the labels of the module. |
| Jump within the file | Outline view in the Explorer, breadcrumbs above the editor, or Ctrl+Shift+O |
| Jump to any symbol of the project | Ctrl+T, then type a part of the name |
| See undefined labels | Problems panel (Ctrl+Shift+M) |
| Find dead code | Right-click in the editor > "Find Labels with no Reference". The list appears in the Output panel. |
| Format | Shift+Alt+F for the file, Ctrl+K Ctrl+F for the selection, or `"editor.formatOnSave": true` |
| Fold | The arrows next to the line numbers: labels, comment blocks, `MODULE`, `STRUCT`, `MACRO`, `DUP`/`REPT`, `IF`, `LUA` (a label folds up to the next label, within the block it is in) |
| Block comments | Typing `/*` adds `*/` on the next line. To turn this off: `"[sjasmplus]": { "editor.autoClosingComments": "never" }` |
| Convert numbers | The "Hexadecimal Calculator" view in the Explorer (and in Run and Debug) |
| Assembler in Markdown | Start a code block with ` ```sjasmplus `, ` ```z80 ` or ` ```asm ` (` ```sjasmplus-list ` for listings) |

### Problems ("Label not found")

References to labels that are defined nowhere are reported, like sjasmplus would. To keep this free of false alarms, these are not reported:

- code in `IFDEF`/`IFNDEF` blocks that are not assembled (these are dimmed; set `defines` for the defines of your command line),
- macro arguments and macro bodies, the values of `DEFINE`s, the text of `ASSERT` messages,
- a label that `IF EXIST label` / `IFN EXIST label` tests, and the uses of it in the blocks of that condition (including `ELSE`): the label may be absent there by design,
- files that no program includes. A program is a main file with `DEVICE`, `OUTPUT` or one of the `SAVE...` directives; other files are fragments, e.g. old code lying around.

### Formatting

The formatter keeps the style of each file instead of imposing one. It is the default formatter of sjasmplus files, also when `editor.defaultFormatter` names another extension. It only changes whitespace (and the case of keywords if you ask for it); labels stay at the beginning of the line and the code itself never changes.

- Instructions move to the column most lines of the file use. Lines indented deeper are nested code (e.g. the body of an `IF` inside a routine) and keep their offset. Directives written left of the instructions (`MODULE`, `IFDEF`, `DEFINE`, ...) keep their own column.
- Comments after code are aligned within each group of consecutive lines.
- Tabs or spaces and the tab size come from the editor (`editor.insertSpaces`, `editor.tabSize`).
- Lines in block comments, Lua, multi-line struct initializers and lines with `/* */` are left as they are.

All of this can be changed with the `format.` settings below, e.g. a fixed column, lower case keywords or a space after commas.

### Colors

The colors come from your color theme (Ctrl+K Ctrl+T). To change single colors for sjasmplus only, use `editor.tokenColorCustomizations` with scopes below `source.sjasmplus`:

```json
"editor.tokenColorCustomizations": {
    "textMateRules": [
        { "scope": "source.sjasmplus keyword.other.instruction", "settings": { "foreground": "#569CD6" } },
        { "scope": "source.sjasmplus keyword.control.directive", "settings": { "foreground": "#C586C0" } },
        { "scope": "source.sjasmplus support.type.register", "settings": { "foreground": "#4EC9B0" } },
        { "scope": "source.sjasmplus entity.name.function.label", "settings": { "fontStyle": "bold" } }
    ]
}
```

"Developer: Inspect Editor Tokens and Scopes" (Ctrl+Shift+P) shows the scopes and semantic token types under the cursor. Semantic colors (code labels `function`, data `variable`, constants `variable.readonly`, structs `struct`, fields `property`, macros `macro`, defines `macro.readonly`, modules `namespace`) can be changed with `editor.semanticTokenColorCustomizations`, e.g. macros (definitions and calls) in their own color:

```json
"editor.semanticTokenColorCustomizations": {
    "rules": {
        "macro:sjasmplus": { "foreground": "#FF9E3B", "bold": true },
        "macro.readonly:sjasmplus": "#4FC1FF"
    }
}
```

A label is colored as data when the first statement after it that assembles something is a data directive (`db`, `dw`, `ds`, …), `INCBIN` or a struct instance, and as a code label otherwise. That statement is looked for on the label's line, then on the next lines, skipping comments, empty lines, other labels and directives that emit nothing (`IF`/`ENDIF`, `DUP`/`EDUP`, `DISPLAY`, `ASSERT`, `DEFINE`, …). A macro call counts as the first such statement of its body. `ORG`, `ALIGN`, `INCLUDE` and other directives end the search, the label stays a code label.

The second rule keeps defines out (they would match `macro` too).

VS Code shows hex numbers like `#4000` or `#FF0000` as colors with a color picker in any file. The extension turns this off for sjasmplus files and listings; to get it back, set `"[sjasmplus]": { "editor.colorDecorators": true }`.

## Other assembler extensions

A file has one language, and only the extensions for that language work on it. Several extensions contribute a language for `.asm` and `.inc`: DeZog and ASM Code Lens (`asm-collection`), Z80 Macro-Assembler (`z80-macroasm`), Z80 Assembly (`z80-asm`). When nothing in the settings decides it, VS Code picks one of them by the extension ids, often not sjasmplus. Settings like `"*.asm": "asm-collection"` (from ASM Code Lens 2.x) send the files elsewhere too.

NASM Code Lens (ASM Code Lens 3.x) writes `"*.{asm,inc,s,nasm,yasm,-----…}": "asm-x86-nasm"` (or `"asm-z80-sjasmplus"`) to the user settings on its first start. Of several matching entries VS Code takes the longest, so this one wins over `"*.asm": "sjasmplus"`, and stays after NASM Code Lens is uninstalled (then the files open as plain text). The fix below takes `asm` and `inc` out of it; the rest (e.g. `"*.{s,-----…}"`) stays for NASM Code Lens, or is removed if NASM Code Lens is not installed. NASM Code Lens also shows its own reference counts in sjasmplus files, so with both extensions every label gets two: disable it for your sjasmplus workspaces.

When a `.asm` file opens in another language, or `files.associations` has such entries, the extension offers to associate the files with sjasmplus, for the workspace or everywhere. You can also run the command "sjasmplus: Check file associations" later, or add the associations by hand:

```json
"files.associations": {
    "*.asm": "sjasmplus",
    "*.inc": "sjasmplus",
    "*.a80": "sjasmplus",
    "*.z80": "sjasmplus",
    "*.lst": "sjasmplus-list"
}
```

Extensions that work on top of a language need sjasmplus added to their settings, e.g. Z80 Assembly meter: `"z80-asm-meter.languageIds": ["sjasmplus"]`. DeZog breakpoints can be set in sjasmplus files and listings: the extension enables breakpoints for its languages. During a DeZog session the context menu of sjasmplus files has the items DeZog shows for its own language: Move Program Counter to Cursor, Disassembly at Cursor, Analyze at Cursor.

## How it understands your project

The extension builds a symbol index the way sjasmplus assembles: it starts at the main files (the files that no other file includes), follows `INCLUDE`s with the include paths and gives every symbol its full sjasmplus name:

- `MODULE` prefixes, also when the module is opened in the including file; `@global` labels; `!labels` that don't start a new local scope
- local labels `.loop` belong to the preceding label; `Main.loop` refers to them from elsewhere
- lookup like sjasmplus: first in the current module, then global
- `STRUCT` fields and the fields of struct instances (`pos POINT` defines `pos.x`, references to `pos.x` count for `POINT.x`)
- macros are expanded where they are used: labels inside a macro get the module and local scope of the call site
- temporary labels (`1`, `1_B`, `1_F`, and `1B`/`1F` in branches)
- `DEFINE`, `UNDEFINE`, `IFDEF`/`IFNDEF`, `EQU`, `DEFL`/`=`, and defines and labels created by Lua (`sj.insert_define`, `sj.insert_label`)

## Settings

All settings start with `sjasmplus-code-lens.` and can be set per workspace folder (except the ones marked *user*).

### Project

| Setting | Default | Description |
|---|---|---|
| `includePaths` | `[]` | Directories searched for `INCLUDE` files, like `-i`/`--inc`. Relative to the workspace folder, `${workspaceFolder}` may be used. The workspace folder itself is always searched. |
| `defines` | `[]` | Defines of the command line (`-D`), e.g. `["_DEBUG_"]`. Used to know which `IFDEF`/`IFNDEF` blocks are assembled. |
| `dirbol` | `false` | Directives at the beginning of a line, like `--dirbol`. |
| `excludeFiles` | `""` | Glob of files to leave out, e.g. `**/{old,_archive}/**`. Worth it for folders with sources of other assemblers: they are indexed too and slow down large workspaces. |

### Features

| Setting | Default | Description |
|---|---|---|
| `enableCodeLenses` | `true` | Reference counts above the labels. |
| `enableHovering` | `true` | Comments of a definition when hovering. |
| `enableCompletions` | `true` | Completions. |
| `completionsRequiredLength` | `1` | Characters to type before completions are offered (not needed after a `.`). |
| `enableGotoDefinition` | `true` | Go to Definition. |
| `enableFindAllReferences` | `true` | Find All References. |
| `enableRenaming` | `true` | Rename. |
| `enableOutlineView` | `true` | Outline view and breadcrumbs. |
| `enableWorkspaceSymbols` | `true` | "Go to Symbol in Workspace" (Ctrl+T). |
| `workspaceSymbolsRequiredLength` | `2` | Characters to type before workspace symbols are listed. |
| `enableFolding` | `true` | Code folding. |
| `enableFormatting` | `true` | Formatting. |
| `enableSemanticHighlighting` | `true` | Colors from the symbol index. Needs `editor.semanticHighlighting.enabled` (on for most themes). |
| `diagnostics.unresolvedLabels` | `warning` | Severity of "Label not found": `off`, `hint`, `information`, `warning`, `error`. |
| `dimInactiveBlocks` | `true` | Dim `IFDEF`/`IFNDEF` blocks that are not assembled. |
| `enablePushPopMatching` | `true` | *user* Highlight matching `push`/`pop` like brackets. |
| `comments.toggleLineCommentPrefix` | `;` | *user* Prefix for "Toggle Line Comment" (Ctrl+/), e.g. `//`. |

### Formatting

| Setting | Default | Description |
|---|---|---|
| `format.indentation` | `align` | `align`: statements go to the instruction column, nested code keeps its offset, outdented directives go to the directive column. `keep`: indentation is not changed. |
| `format.instructionColumn` | `0` | 0 = the most frequent column of the file, or a column counted from 0 (24 = three tabs of 8). |
| `format.directiveColumn` | `0` | 0 = the most frequent column of the outdented directives of the file, or a column. |
| `format.case` | `keep` | `lower` / `upper` for instructions, directives, registers, conditions and operator words. Labels, macros and strings are never changed. |
| `format.commaSpace` | `keep` | `none` (`ld a,b`) or `space` (`ld a, b`). The double comma `,,` stays together. |
| `format.operandSpacing` | `keep` | `space` or `tab` between the instruction and its operands. |
| `format.trailingComments` | `align` | `align` comments after code (per group of consecutive lines, or to `format.commentColumn`), or `keep`. |
| `format.commentColumn` | `0` | 0 = per group of lines, or a column counted from 0. |

### Hexadecimal calculator

| Setting | Default | Description |
|---|---|---|
| `hexCalculator.showInExplorer` | `true` | Show the calculator in the Explorer. |
| `hexCalculator.showInDebug` | `true` | Show the calculator in Run and Debug. |
| `hexCalculator.hexPrefix` | `0x` | *user* Prefix of hex values, e.g. `$` or `#`. |

## Commands

| Command | Description |
|---|---|
| Find Labels with no Reference | Editor context menu. Lists labels, constants, structs, fields and macros that are never used. |
| sjasmplus: Check file associations | Checks `files.associations` and other installed extensions for assembler files that are sent to other languages and offers to fix them. |
| sjasmplus: Associate assembler files with sjasmplus in this workspace | Fixes them for the workspace without asking. |

## Limitations

- Conditions with expressions (`IF`, `IFN`, `IFUSED`) are not evaluated; their blocks count as assembled.
- Labels inside macros are resolved where the macro is used. A label whose name contains a macro parameter (`tag_exit` with the parameter `tag`) is also known under the name of each expansion (`gb_exit` for `decode gb`), as a derived definition: go to definition leads to the label in the macro, and its reference count includes the uses of the expanded names. Such names cannot be renamed. Arguments that are not a name (numbers, expressions, strings) and references inside macro bodies are not substituted; names glued together by `DEFINE` substitution are not followed.
- `OPT --syntax=...` in the source is followed for macro arguments only: with the letter `s` an argument replaces whole words, otherwise also sub-words delimited by underscores (`OPT push`/`pop`/`reset` are followed). Other syntax options and the command line (`--syntax=...`) are not known; highlighting follows the sjasmplus defaults.
- Each listing file is indexed on its own.

## Feedback

- **Questions, help, discussion:** the Telegram chat [t.me/sjasmpluscodelens](https://t.me/sjasmpluscodelens)
- **Bugs and feature requests:** [GitHub issues](https://github.com/kolnogorov/sjasmplus-code-lens/issues). For a wrong reference or "Label not found", a few lines of source that show it help the most.

## Development

- `npm ci`, then start "Launch Extension: open a project" in the Run and Debug view (F5). It asks for a sjasmplus project folder and opens it in an Extension Development Host window with this extension loaded.
- `npm test` runs the unit tests of the parser, the symbol index and the formatter.
- `npm run test:integration` runs the providers inside a downloaded VS Code on the project in `tests/integration/fixture`.
- `npm run package` builds the `.vsix` (install it with "Extensions: Install from VSIX..."), `npm run publish` publishes it to the Marketplace.

## Credits

Based on [ASM Code Lens](https://marketplace.visualstudio.com/items?itemName=maziac.asm-code-lens) 2.x by maziac, released under the MIT License.

## License

[MIT](LICENSE)
