# create-lwc-plugin

**create-lwc-plugin** is an npm package designed to simplify the process of
creating a new plugin for Lightweight Charts™. With this generator, you can
quickly scaffold a project from a template for either

- a Series primitive plugin,
- a Pane primitive plugin, or
- a Custom series plugin.

By using this wizard-like tool, you can customize the initial setup of their
plugin project by answering a few questions. This allows for a seamless and
efficient starting point, saving valuable time and effort.

The scaffolded project is ready to publish: its `package.json` follows the
conventions used by the Lightweight Charts™ plugin catalogue, so the plugin can
be listed there once it is published to npm.

Whether you are developing a new primitive plugin or a Custom series plugin for
Lightweight Charts, this generator provides a structured and organized
foundation. It ensures that your plugin adheres to the best practices and
conventions of Lightweight Charts, making it easier to develop, maintain, and
contribute to the community.

Getting started with your Lightweight Charts plugin development has never been
easier. Let the Lightweight Charts™ Plugin Scaffold Generator
(`create-lwc-plugin`) handle the initial setup, so you can focus on creating
outstanding plugins for Lightweight Charts™.

✨ Need some examples for inspiration? Check out the
[plugin-examples](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples)
folder in the Lightweight Charts repo.

## Scaffolding Your First Lightweight Charts™ Plugin

With NPM:

```bash
npm create lwc-plugin@latest
```

With Yarn:

```bash
yarn create lwc-plugin
```

With PNPM:

```bash
pnpm create lwc-plugin
```

The wizard asks for the plugin's name, description, author, licence, the minimum
version of Lightweight Charts™ it supports, and the tags to list it under. Those
answers populate the generated `package.json`, including the `lwcPlugin` block
read by the plugin catalogue.

## Using the generated project

### Running Locally (during development)

```shell
npm install
npm run dev
```

Visit `localhost:5173` in the browser.

### Building the Plugin

```shell
npm run build
```

This writes three files into the `dist` folder: the package entry point
(`<name>.js`), a standalone build for use over a CDN
(`<name>.standalone.js`) which inlines every dependency except
Lightweight Charts™ itself, and the bundled type declarations (`<name>.d.ts`).
Plugins are published as ES modules only.

### Publishing To NPM

The `package.json` in the project root is the published manifest. Check its
`description`, `version`, `license` and `lwcPlugin` fields, then publish from
the project root:

```shell
npm publish
```

Hint: append `--dry-run` to the end of the publish command to see the results of
the publish command without actually uploading the package to NPM.

## Scaffolding an official in-repo plugin

Maintainers working inside the Lightweight Charts™ repository can scaffold a
workspace package instead of a standalone project:

```shell
pnpm create lwc-plugin --workspace
```

Workspace mode targets `packages/`, scopes the package name to `@tradingview/`,
depends on the library and the shared plugin utilities through `workspace:*`,
seeds a `CHANGELOG.md`, `LICENSE` and `NOTICE`, and marks the plugin as an
official catalogue entry.
