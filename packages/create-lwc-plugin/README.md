# create-lwc-plugin

**create-lwc-plugin** is an npm package designed to simplify the process of
creating a new plugin for Lightweight Charts™. With this generator, you can
quickly scaffold a project from a template for either

- a Drawing primitive plugin, or
- a Custom series plugin.

By using this wizard-like tool, you can customize the initial setup of their
plugin project by answering a few questions. This allows for a seamless and
efficient starting point, saving valuable time and effort.

Whether you are developing a new Drawing primitive plugin or a Custom series
plugin for Lightweight Charts, this generator provides a structured and
organized foundation. It ensures that your plugin adheres to the best practices
and conventions of Lightweight Charts, making it easier to develop, maintain,
and contribute to the community.

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

## Using the generated project

### Running Locally (during development)

```shell
npm install
npm run dev
```

Visit `localhost:5173` in the browser.

### Compiling the Plugin

```shell
npm run compile
```

Check the output in the `dist` folder.

### Publishing To NPM

You can configure the contents of the package's `package.json` within the
`compile.mjs` script.

Once you have compiled the plugin (see above section) then you can publish the
package to NPM with these commands:

```shell
cd dist
npm publish
```

Hint: append `--dry-run` to the end of the publish command to see the results of
the publish command without actually uploading the package to NPM.
