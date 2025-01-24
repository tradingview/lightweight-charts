# About

The playground is designed for running your snippet continuously against a local build of the `lightweight-charts` package. It's a space for contributors to validate local changes or experiment interactively with charts.

The snippet is served using the `wwwroot` folder. Every modification triggers live reload to reflect your changes instantly at [http://localhost:5173](http://localhost:5173).

## Usage

To start the playground, run:

```bash
npm run dev
```

To start the playground from a clean state, run:

```bash
npm run dev:clean
```

## Details

| Name | Description |
| ---- | ----------- |
| Extra packages | If you need extra dependencies in your playground, feel free to install them. These will not be committed. |
| Entrypoint location | The entry point for the playground is `wwwroot/index.html`, which loads `wwwroot/src/main.tsx`. |
| Sources root | The source files for running snippets in the playground are located in the `wwwroot/src/` folder. The `wwwroot/src/main.tsx` script is loaded automatically. |
| Ignored paths | `package.json` and `wwwroot/` |
