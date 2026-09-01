# Lightweight Charts™ Indicator Examples

This directory contains implementations of indicator calculations and examples of how they can be shown on a chart.

## Learning More

- [Learn more about Lightweight Charts™](https://www.tradingview.com/lightweight-charts/)

## Running Locally

To run these examples locally follow these steps:

1. Clone the repo to your local machine
2. First install the dependencies (the repository is a pnpm workspace, so a single install in the root directory covers all the projects) and build the library

   ```shell
   pnpm install
   pnpm build:prod
   ```

3. Switch to the Indicator Examples Folder and start the development server

   ```shell
   cd indicator-examples
   pnpm dev
   ```

4. Visit `localhost:5173` in the browser.

## Compiling the Examples

```shell
pnpm compile
```

Check the output in the `compiled` folder.

## Using an Example

Once you have compiled the examples then simply copy that folder into your
project and import the JS module in your code.

Alternatively you can copy the source directly into your project structure and compile it with your own toolchain.
