# _PLUGINNAME_

_DESCRIPTION_

<!--
Expand the line above into a short paragraph: what the plugin draws or does, and
when someone would reach for it. This is the first thing a reader sees, both on
npm and on the plugin registry page.
-->

## Installation

### npm

Install the package. It requires `lightweight-charts` `_PEERVERSION_` in your
project:

```shell
npm install _PACKAGENAME_
```

Then import the plugin and add it to a chart:

```js
_ATTACH_SNIPPET_
```

### CDN

The plugin is published as ES modules. Map the library and the plugin to their
CDN builds with an import map:

```html
<script type="importmap">
{
  "imports": {
    "lightweight-charts": "https://unpkg.com/lightweight-charts@^5/dist/lightweight-charts.standalone.production.mjs",
    "_PACKAGENAME_": "https://unpkg.com/_PACKAGENAME_/dist/_ENTRYNAME_.standalone.js"
  }
}
</script>
```

The plugin can then be imported by name, exactly as it is under a bundler:

```html
<script type="module">
_ATTACH_SNIPPET_
</script>
```

## Usage

<!-- Describe the plugin's typical usage, and anything a caller has to own. -->

```js
_USAGE_SNIPPET_
```

## Options

<!--
List the options the plugin accepts. Add further tables for any nested option
groups. Keep this in sync with the option types in the source.
-->

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
|        |      |         |             |

The full typed surface is published with the package — see
[`dist/_ENTRYNAME_.d.ts`](https://unpkg.com/_PACKAGENAME_/dist/_ENTRYNAME_.d.ts),
also browsable from the Code tab on the package's npm page.

## Development

Install the dependencies and start the example page:

```shell
npm install
npm run dev
```

Visit `localhost:5173` in the browser. The example under `src/example/` is the
plugin's live preview — keep it working, and keep it filling the window so that
it can be embedded.

Build the publishable bundles into `dist/`:

```shell
npm run build
```

This produces the package entry point (`dist/_ENTRYNAME_.js`), the standalone
build used over a CDN (`dist/_ENTRYNAME_.standalone.js`) and the bundled type
declarations (`dist/_ENTRYNAME_.d.ts`).

<!-- EXTERNAL_ONLY -->
## Publishing to npm

The `package.json` in the project root is the published manifest: check the
`description`, `version`, `license` and `lwcPlugin` fields before releasing.
Publish from the project root once the plugin has been built:

```shell
npm publish
```

Hint: append `--dry-run` to inspect the result without uploading anything.

## Discoverability

Tag the plugin so that others can find it: add the `lightweight-charts-plugin`
topic to its GitHub repository, and keep the `lightweight-charts-plugin` keyword
in `package.json`.
<!-- /EXTERNAL_ONLY -->
