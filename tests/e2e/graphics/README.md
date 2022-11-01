# Graphics tests

This tests uses [puppeteer](https://github.com/GoogleChrome/puppeteer) to generate screenshots and then [pixelmatch](https://github.com/mapbox/pixelmatch) to compare them.

## How it works

1. If there are local files to serve - run web server.
1. Run `mocha` with loaded test cases.
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

To run this tests you need use [runner.js](./runner.js):

```bash
./runner.js ./path/to/golden/standalone/module.js ./path/to/test/standalone/module.js
```

Each path to the standalone module might be either to a local file (relative/absolute path to a file) or remote file (via http/https).
If file is local then local server will be runner to serve that file (see [serve-local-files.js](../serve-local-files.js) module).

## Tips

1. By default for each test case golden, test and diff screenshots will be written to a `.gendata` folder (can be changed via `CMP_OUT_DIR` env variable).
    So, you can see what's the difference between screenshots there.

1. Also, together with screenshots you can find there HTML pages which was opened to generate that screenshots.
    But if you test with local files, you cannot open that HTML pages in your browser to debug because there is scripts which are loaded from webserver (which a runner up to runs tests).
    In that can you can use the following hack.

    Let's say you run your tests in that way - `./runner.js ./golden/standalone/module.js ./test/standalone/module.js`.
    After that in `.gendata/test-case-name/1.golden.html` you can find a HTML page.
    To open this page properly you can run `./tests/e2e/serve-static-files.js golden.js:./golden/standalone/module.js test.js:./test/standalone/module.js` and then open that page in the browser to debug.

1. The following environmental variables can be used to adjust the test:

    - `PRODUCTION_BUILD`: Set to true if testing a Production build
    - `DEVICE_PIXEL_RATIO`: Device pixel ratio to simulate during the test (number)

1. You can set Mocha options from the command line arguments:

```bash
node ./tests/e2e/graphics/runner.js ./path/to/golden/standalone/module.js ./path/to/test/standalone/module.js --bail --grep "add-series"
```
