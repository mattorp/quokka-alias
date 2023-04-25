# Quokka Alias

`quokka-alias` is a Visual Studio Code extension that automatically updates your `.quokka` file with aliases used in the imports of the current TypeScript file. It reads aliases from the `tsconfig.json` file located in the root of your project.

Example:

```ts
import { foo } from '@/bar';
// ...
```

The `.quokka` file, after running the command:

```json
{
  "aliases": {
    "@/bar": "./bar"
  }
}
```

## Features

- Automatically include aliases from imports in the `.quokka` file based on your `tsconfig.json` file.
- Compatible with TypeScript files.

## Getting Started

- Install the [Quokka.js extension](https://marketplace.visualstudio.com/items?itemName=WallabyJs.quokka-vscode) if you haven't already.
- Install the [alias-quokka-plugin](https://github.com/Gozala/alias-quokka-plugin) if you haven't already.
  - `yarn add -D alias-quokka-plugin`
  - `pnpm add -D alias-quokka-plugin`
  - `npm install --save-dev alias-quokka-plugin`
- Make sure you have a `.quokka` file and a `tsconfig.json` file in the root of your project and that it includes the `alias-quokka-plugin` plugin.
- Install the quokka-alias extension (this extension).

Your `.quokka` file should look something like this:

```json
{
  "plugins": [
    "alias-quokka-plugin",
    // Other plugins (optional)
    ],
  "alias": {
    // Your existing aliases (optional)
  },
  // Other settings (optional)
}
```

### Usage

To use the command, make sure the typescript file is the currently active file and run the command `Include aliases from imports in the current file in .quokka` from the command palette. After running the command, the `.quokka` file will be updated with the aliases used in the current file based on the `tsconfig.json`.

Since Quokka needs to restart for this to take effect, you can use the [runCommands functionality](https://code.visualstudio.com/docs/getstarted/keybindings#_running-multiple-commands) to simplify this (introduced in VSCode 1.77). If you use the `Quokka.js Run once for Current File` command, consider replacing your current keybinding with the following by opening the shortcuts JSON using the command: `Preferences: Open Keyboard Shortcuts (JSON)`.

```json
{
  "key": "cmd+r", // replace with your preferred keybinding
  "command": "runCommands",
  "args": {
    "commands": [
      "quokka-alias.include-aliases",
      "quokka.stopCurrent",
      "quokka.runOnce"
    ]
  },
  "when": "editorLangId == typescript"
},
```

For the interactive Quokka.js mode, you can use this:

```json
{
  "key": "cmd+k shift+i", // replace with your preferred keybinding
  "command": "runCommands",
  "args": {
    "commands": [
      "quokka-alias.include-aliases",
      "quokka.stopCurrent",
      "quokka.makeQuokkaFromExistingFile"
    ]
  },
  "when": "editorLangId == typescript"
},
```

Alternatively, to set a keybinding for the command alone use the following:

```json
{
  "key": "cmd+k shift+i", // replace with your preferred keybinding
  "command": "quokka-alias.include-aliases",
  "when": "editorLangId == typescript"
},
```

### Examples

Given a `tsconfig.json` file like this:

```json
{
  "paths": {
    "@/*": [
      "./*",
    ]
  }
}
```

And a file opened in the editor:

```ts
import { foo } from '@/bar';
```

If your `.quokka` file initially contains an alias like this:

```json
{
  "aliases": {
    "@/qux": "./qux"
  }
}
```

After running the command, the `.quokka` file will be updated with the new alias:

```json
{
  "aliases": {
    "@/bar": "./bar",
    "@/qux": "./qux"
  }
}
```

__Note__: The extension does not check for dangling aliases. If an alias is removed or no longer needed, you must manually remove it from the `.quokka` file.

## Requirements

- [Quokka.js extension](https://marketplace.visualstudio.com/items?itemName=WallabyJs.quokka-vscode)
- A `.quokka` file in the root of your project.
- A `tsconfig.json` file in the root of your project.

## Known Issues

The extension currently only handles the first entry for each alias in the paths object in `tsconfig.json`. For example:

```json
{
  "paths": {
    "@/*": [
      "./*", // included
      "second_path/*" // not included
    ],
    "src/*": [
      "./src/*", // included
      "second_path/*" // not included
    ]
  }
}
```

## Motivation

The `alias-quokka-plugin` does not currently handle aliases for some setups. This extension serves as a workaround for that issue.

## Release Notes

### 0.1.0

- Initial release.
- Adds the command `quokka-alias.add-aliases`: `Include aliases from imports in the current file in .quokka`
