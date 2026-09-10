# Lightweight Charts™ plugin examples

This folder hosts the demo gallery for Lightweight Charts™ plugins, and is
split into two kinds of content:

- **Official plugins** — maintained, published npm packages, listed in the
  [plugin catalog](https://tradingview.github.io/lightweight-charts/plugins).
  Their page here redirects to the package's demo; the source lives under
  [`packages/lwc-plugin-*`](https://github.com/tradingview/lightweight-charts/tree/master/packages)
  instead of in this folder.
- **Example plugins** — proof-of-concept starting points that live entirely in
  this folder, meant to be copied and adapted rather than installed.

## Official plugins

Browse the [plugin catalog](https://tradingview.github.io/lightweight-charts/plugins)
for the full, current list, each with its README, options and an `npm install`
command. These are maintained packages: expect updates, versioned releases and
a `CHANGELOG.md`, unlike the example plugins below.

Install one from npm, as directed on its catalog page, for example:

```shell
npm install @tradingview/lwc-plugin-accessibility
```

## Example plugins

**Disclaimer:** these plugins are provided as-is, and are primarily intended as
proof-of-concept examples and starting points. They have not been fully
optimized for production and may not receive updates or improvements over time.

We believe in the power of community collaboration, and we warmly welcome any
pull requests (PRs) aimed at enhancing and fixing the existing examples.
Additionally, we encourage you to create your own plugins and share them with
the community. We would be delighted to showcase the best plugins our users
create in this README.

✨ If you have something cool to share or if you need assistance, don't
hesitate to get in touch.

### Run the demo gallery locally

1. Clone the repo to your local machine.
2. Install the dependencies (the repository is a pnpm workspace, so a single install in the root directory covers all the projects) and build the library:

   ```shell
   pnpm install
   pnpm build:prod
   ```

3. Switch to the `plugin-examples` folder and start the development server:

   ```shell
   cd plugin-examples
   pnpm dev
   ```

4. Visit `localhost:5173` in the browser.

You can also view a demo page of every plugin in this repo, official and
example alike, without running anything locally:
[Plugin examples](https://tradingview.github.io/lightweight-charts/plugin-examples).

### Compile and use one in your project

Example plugins are not published, so instead you compile them from source
and copy the output into your project.

```shell
pnpm compile
```

Check the output in the `compiled` folder, then:

1. Copy the compiled plugin folder into your project, example:
   `plugins/background-shade-series` (from `compiled/background-shade-series`)
2. Within your project, you can import the class as follows:

   ```js
   import { BackgroundShadeSeries } from '../plugins/background-shade-series/background-shade-series';

   // ...

   const backgroundShadeSeriesPlugin = new BackgroundShadeSeries();
   const myCustomSeries = chart.addCustomSeries(backgroundShadeSeriesPlugin, {
       lowValue: 0,
       highValue: 1000,
   });
   ```

## Create your own plugin

[create-lwc-plugin](https://github.com/tradingview/lightweight-charts/tree/master/packages/create-lwc-plugin) is an npm
package designed to simplify the process of creating a new plugin for
Lightweight Charts™. With this generator, you can quickly scaffold a project
from a template for either

- a series primitive plugin,
- a pane primitive plugin, or
- a custom series plugin.

You can get started with this simple command:

```shell
npm create lwc-plugin@latest
```

## Learn more

- [Plugin catalog](https://tradingview.github.io/lightweight-charts/plugins)
- [Documentation for plugins](https://tradingview.github.io/lightweight-charts/docs/next/plugins/intro)
- [Learn more about Lightweight Charts™](https://www.tradingview.com/lightweight-charts/)
