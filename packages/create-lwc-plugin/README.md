# create-lwc-plugin

**create-lwc-plugin** scaffolds a new Lightweight Charts™ plugin project from a
template, for a series primitive, a pane primitive, or a custom series. Answer
a few questions in the wizard and it generates a structured, ready-to-publish
project: its `package.json` already follows the conventions used by the
[Lightweight Charts™ plugin catalog](https://tradingview.github.io/lightweight-charts/plugins),
so the plugin can be listed there once it is published to npm.

✨ Need some examples for inspiration? Browse the
[plugin catalog](https://tradingview.github.io/lightweight-charts/plugins) or
check out the
[plugin-examples](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples)
folder in the Lightweight Charts™ repo.

## Scaffold your first Lightweight Charts™ plugin

With npm:

```bash
npm create lwc-plugin@latest
```

With Yarn:

```bash
yarn create lwc-plugin
```

With pnpm:

```bash
pnpm create lwc-plugin
```

The wizard asks for the plugin's name, description, author, license, the minimum
version of Lightweight Charts™ it supports, and the tags to list it under. Those
answers populate the generated `package.json`, including the `lwcPlugin` block
read by the plugin catalog.

## Use the generated project

### Run it locally (during development)

```shell
npm install
npm run dev
```

Visit `localhost:5173` in the browser.

### Build the plugin

```shell
npm run build
```

This writes three files into the `dist` folder:

- the package entry point (`<name>.js`)
- a standalone build for use over a CDN (`<name>.standalone.js`), which inlines every dependency except Lightweight Charts™ itself
- the bundled type declarations (`<name>.d.ts`)

Plugins are published as ES modules only.

### Publish to npm

The `package.json` in the project root is the published manifest. Check its
`description`, `version`, `license` and `lwcPlugin` fields, then publish from
the project root:

```shell
npm publish
```

**Hint:** append `--dry-run` to the end of the publish command to see the results of
the publish command without actually uploading the package to npm.

## Scaffold an official in-repo plugin

Maintainers working inside the Lightweight Charts™ repository can scaffold a
workspace package instead of a standalone project:

```shell
pnpm create lwc-plugin --workspace
```

Workspace mode targets `packages/`, scopes the package name to `@tradingview/`,
depends on the library and the shared plugin utilities through `workspace:*`,
seeds a `CHANGELOG.md`, `LICENSE` and `NOTICE`, and marks the plugin as an
official catalog entry.
