# Lightweight Charts™ Plugin Examples

This folder contains a collection of example plugins designed to extend the
functionality of Lightweight Charts™ and inspire the development of your own
plugins.

**Disclaimer:** These plugins are provided as-is, and are primarily intended as
proof-of-concept examples and starting points. They have not been fully
optimized for production and may not receive updates or improvements over time.

We believe in the power of community collaboration, and we warmly welcome any
pull requests (PRs) aimed at enhancing and fixing the existing examples.
Additionally, we encourage you to create your own plugins and share them with
the community. We would be delighted to showcase the best plugins our users
create in this readme document.

✨ If you have something cool to share or if you need assistance, please don't
hesitate to get in touch.

🚀 Need a starting point for your plugin idea? Check out
[create-lwc-plugin](https://www.npmjs.com/package/create-lwc-plugin) package.

📊 You can view a demo page of the plugins within this repo at his link:
[Plugin Examples](https://tradingview.github.io/lightweight-charts/plugin-examples)

## Learning More

- [Documentation for Plugins](https://tradingview.github.io/lightweight-charts/docs/next/plugins/intro)
- [Learn more about Lightweight Charts™](https://www.tradingview.com/lightweight-charts/)

## Running Locally

To run this repo locally, follow these steps:

1. Clone the repo to your local machine
2. First build the library

   ```shell
   npm install
   npm run build:prod
   ```

3. Switch to the Plugin Examples Folder, install and start the development server

   ```shell
   cd plugin-examples
   npm install
   npm run dev
   ```

4. Visit `localhost:5173` in the browser.

## Compiling the Examples

```shell
npm run compile
```

Check the output in the `compiled` folder.

## Using an Example

Once you have compiled the examples then simply copy that folder into your
project and import the JS module in your code.

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

## Creating your own Plugin

[create-lwc-plugin](https://github.com/tradingview/lightweight-charts/tree/master/packages/create-lwc-plugin) is an npm
package designed to simplify the process of creating a new plugin for
Lightweight Charts™. With this generator, you can quickly scaffold a project
from a template for either

- a Drawing primitive plugin, or
- a Custom series plugin.

You can get started with this simple command:

```shell
npm create lwc-plugin@latest
```
