# Graphics tests

This tests uses [puppeteer](https://github.com/GoogleChrome/puppeteer) to generate screenshots and then [pixelmatch](https://github.com/mapbox/pixelmatch) to compare them.

## How it works

1. If there are local files to serve - run web server.
1. Run `node:test` with loaded test cases.
1. Then, for each test case, open webpage by `puppeteer` for golden and test version, take 2 screenshots.
1. Compare given screenshots by `pixelmatch`, write them in out folder (with HTML pages).

## Writing new test case

1. Create new file in [test-cases](./test-cases) folder called `test-case-name.js` (`test-case-name` will be used as test case name).

1. Write your test case in that file.

    There is the only 1 requirement for your code - you need to define function called `runTestCase`, which takes a container as the first argument and creates there a widget.
    Also `runTestCase` might return a `Promise`. In this case the runner will wait for it before continue a test.
    _(the definition of that function is `function runTestCase(container: HTMLElement): void | Promise<void> {}`)_

Note that case's file wouldn't prepared/parsed by any bundler/processor (or even by NodeJS), so please pay attention, that you **CAN'T** require other modules in a test case.

## Running tests

This tests runs against 2 versions of the library - "golden" and "test". Golden is LKG version, test - current tested version of the library.

To run this tests you need use [runner.ts](./runner.ts):

```bash
pnpm exec esno ./runner.ts ./path/to/golden/standalone/module.js ./path/to/test/standalone/module.js
```

Each path to the standalone module might be either to a local file (relative/absolute path to a file) or remote file (via http/https).
If file is local then local server will be runner to serve that file (see [serve-local-files.ts](../serve-local-files.ts) module).

## Plugin package test cases

The official plugin packages under `packages/lwc-plugin-*` have their own suite, run with [plugins-runner.ts](./plugins-runner.ts) and, on CI, as the `graphics-tests-part4-plugins` jobs. It reuses this harness; only discovery and the page differ.

- Cases live in `packages/lwc-plugin-<name>/tests/graphics/<case>.js` and follow the same contract as the library cases (`runTestCase(container)`, a classic script with no imports, `window.chart` set unless `ignoreMouseMove` is). The group name is the package folder, so `--grep "lwc-plugin-"` selects the whole suite and `--grep "lwc-plugin-vertical-line/"` one package.
- Two globals are provided: `LightweightCharts` (the library) and `LwcPlugin`, the namespace import of the package under test (`new LwcPlugin.VertLine(...)`). The page loads both through an import map from their ES module builds: the library's `lightweight-charts.standalone.*.mjs` and the package's `dist/<name>.standalone.js` — the file a CDN user imports, so the suite also covers the packaging.
- Golden is the merge-base build of the package _and_ of the library; test is HEAD of both. A package with no golden build (a new package, or a merge-base that predates it) has its cases reported as skipped. As with the library suite, an intentional rendering change fails the job and the reviewer inspects the stored screenshots.

Locally, with the library (`pnpm build`) and the packages (`pnpm --filter "@tradingview/lwc-plugin-*" build`) built:

```bash
pnpm e2e:graphics:plugins --grep "lwc-plugin-vertical-line/"
```

This uses the working tree as both golden and test, so it checks that every case renders without errors. To compare against another revision, run `GRAPHICS_TEST_SUITE=plugins scripts/run-graphics-tests.sh`, or point `plugins-runner.ts` at a folder of golden builds with `--golden-plugins-dir` (one `<package folder>/<name>.standalone.js` per package, or the packages themselves). `GRAPHICS_SERVER_PORT` moves the local file server off its default port when two suites run side by side.

## Branch-Specific Test Cases

By default, the test runner uses the current branch's test case code for both golden and test builds of the library. However, you can configure the test runner to use test case code from different branches:

### Using Golden Branch Test Cases

To use test case code from the golden branch for the golden build (useful when testing API syntax changes):

1. Use the `scripts/run-graphics-tests.sh` script
2. Set the environment variable `BRANCH_SPECIFIC_TEST="true"`

Example:

```bash
BRANCH_SPECIFIC_TEST="true" ./scripts/run-graphics-tests.sh
```

## Tips

1. By default for each test case golden, test and diff screenshots will be written to a `.gendata` folder (can be changed via `CMP_OUT_DIR` env variable).
    So, you can see what's the difference between screenshots there.

1. Also, together with screenshots you can find there HTML pages which was opened to generate that screenshots.
    But if you test with local files, you cannot open that HTML pages in your browser to debug because there is scripts which are loaded from webserver (which a runner up to runs tests).
    In that can you can use the following hack.

    Let's say you run your tests in that way - `pnpm exec esno ./runner.ts ./golden/standalone/module.js ./test/standalone/module.js`.
    After that in `.gendata/test-case-name/1.golden.html` you can find a HTML page.

    To open this page properly you can run `pnpm exec esno ./tests/e2e/serve-static-files.ts golden.js:./golden/standalone/module.js test.js:./test/standalone/module.js` and then open that page in the browser to debug.

1. The following environmental variables can be used to adjust the test:

    - `PRODUCTION_BUILD`: Set to true if testing a Production build
    - `DEVICE_PIXEL_RATIO`: Device pixel ratio to simulate during the test (number)

1. You can set additional options from the command line arguments:

```bash
pnpm exec esno ./tests/e2e/graphics/runner.ts ./path/to/golden/standalone/module.js ./path/to/test/standalone/module.js --bail --grep "add-series"
```
