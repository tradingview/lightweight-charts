# create-lwc-plugin

**create-lwc-plugin** scaffolds a new plugin project for Lightweight Charts™.
The wizard asks a few questions and generates a ready-to-run project from a
template for one of the three plugin types:

- a series primitive
- a pane primitive
- a custom series

The scaffolded project is ready to publish: its `package.json` follows the
conventions used by the Lightweight Charts™ plugin catalog, so the plugin can
be listed there once it is published to npm.

✨ Need some examples for inspiration? Check out the
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

Before any of that, the wizard offers to install the
[plugin-authoring Agent Skill](https://github.com/tradingview/lightweight-charts/blob/master/.github/skills/lightweight-charts-plugin-authoring/SKILL.md)
for AI coding assistants such as Claude Code, Codex, and Cursor. The skill helps
choose the plugin type, build on `@tradingview/lwc-toolkit`, and pick the right
official plugin as the reference for your idea. It also points to the docs and
warns about the autoscale, whitespace, and hit-test mistakes a first plugin
tends to make.

Say yes, and you have two ways to continue. Carry on with the wizard: the skill
is installed into the new project when the wizard finishes. Or quit right
there: the skill is installed into the current directory, and you hand the rest
over to your assistant. The assistant knows how to run this wizard with you.

The skill is installed with the [`skills` CLI](https://github.com/vercel-labs/skills).
The CLI asks which assistants to set it up for. You can also run it yourself at
any time:

```bash
npx skills add tradingview/lightweight-charts --skill lightweight-charts-plugin-authoring
```

## The generated project

### Run locally

```shell
npm install
npm run dev
```

Visit `localhost:5173` in the browser.

### Build the plugin

```shell
npm run build
```

This writes three files into the `dist` folder: the package entry point
(`<name>.js`), a standalone build for use over a CDN
(`<name>.standalone.js`) which inlines every dependency except
Lightweight Charts™ itself, and the bundled type declarations (`<name>.d.ts`).
Plugins are published as ES modules only.

### Publish to npm

The `package.json` in the project root is the published manifest. Check its
`description`, `version`, `license` and `lwcPlugin` fields, then publish from
the project root:

```shell
npm publish
```

Hint: append `--dry-run` to the end of the publish command to see the results of
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
