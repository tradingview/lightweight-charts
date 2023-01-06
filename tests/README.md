# Tests

There are a variety of tests included to ensure the quality, and stability of the library.

When contributing to the library, please note:

1. Every pull request should have an adequate test/s whenever it's possible.
1. If your changes affect painting, then your changes should contain a test case (or test cases) for [graphics tests](./e2e/graphics).
1. Your pull request should pass CI (except checks marked as "not required" - in this case a reviewer should pay attention to job's artifacts). Current CI tests include:
   - Coverage
   - Graphics
   - Memory Leaks
   - Unit Tests

**Note:** The majority of these tests can be run from within VSCode (within 'Run And Debug').

## Unit Tests

The unit tests can be run using the following command:

- `npm run test`

which is equivalent to `mocha tests/unittests/**/*.spec.ts`

The unit tests form part of the `npm run verify` command which should be run before commiting to the repo.

## End-to-end (e2e) Tests

There are several e2e tests which simulate the usage of the library within a browser. Each of the tests listed below make use of Puppeteer to automate this process.

### Coverage

The e2e coverage test attempts to execute as many lines as possible within the library JS file. This is achieved by running a [test script](./e2e/coverage/coverage-test-cases.ts) which attempts to evoke all of the API methods and set as many options as possible. The e2e test simulates a variety of user interactions such as scrolling, clicking, and dragging.

During this execution, if the page reports any errors then the test will fail.

Once the test is completed, it compares the number of lines executed versus the total number of lines in the file. If this percentage is below the thresholds defined in [coverage-config.ts](./e2e/coverage/coverage-config.ts) file then the test will fail.

Note: It is not expected that the coverage score be near 100% due to the nature of the test and the libraries extensive error handling (which doesn't get executed in normal circumstances).

#### Running the Coverage test

You can run the coverage test with the following command:

```bash
./scripts/run-coverage-tests.sh
```

Alternatively, you can run the test on a specific file like this:

```bash
node ./tests/e2e/coverage/runner.js ./dist/lightweight-charts.standalone.development.js
```

#### Analysing the Coverage test

If you set the environmental variable `GENERATE_COVERAGE_FILE` to `true` then the coverage test will generate a `covered.js` file within the `tests/e2e/coverage/.gendata` folder (folder can be changed with the `CMP_OUT_DIR` environmental variable). This file only includes the lines of code which were executed during the test. You can compare this file (diff) with the test input file to identify which lines are not being executed during the test.

Example command:

```bash
GENERATE_COVERAGE_FILE=true node ./tests/e2e/coverage/runner.js ./dist/lightweight-charts.standalone.development.js
```

### Graphics

The e2e graphics tests visually compare the charts produced by the library against a 'golden' release (typically the latest commit on the 'master' branch). Further information about the graphics tests can be viewed here: [Graphics README](./e2e/graphics/README.md).

#### Running the Graphics tests

You can run the graphics tests with the following command:

```bash
./scripts/run-graphics-tests.sh
```

Alternatively, you can run the test on specific files like this:

```bash
node ./tests/e2e/graphics/runner.js ./path/to/golden/standalone/module.js ./path/to/test/standalone/module.js
```

The following enviromental variables can be used to adjust the test:

- `PRODUCTION_BUILD`: Set to true if testing a Production build
- `DEVICE_PIXEL_RATIO`: Device pixel ratio to simulate during the test (number)
- `CMP_OUT_DIR`: Directory to output the test artifacts. (Defaults to `.gendata`)

```bash
PRODUCTION_BUILD=false DEVICE_PIXEL_RATIO=1.5 node ./tests/e2e/graphics/runner.js ./golden/lightweight-charts.standalone.development.js ./dist/lightweight-charts.standalone.development.js
```

### Memory Leaks

The memory leaks test checks whether the library is creating any memory leaks during the creation of a simple chart which is then removed and deleted from the page.

#### Running the Memory Leaks test

You can run the memory leak test with the following command:

```bash
./scripts/run-memleaks-tests.sh
```

Alternatively, you can run the test on a specific file like this:

```bash
node ./tests/e2e/memleaks/runner.js ./dist/lightweight-charts.standalone.development.js
```

### Interactions

The interactions tests check whether the library is correctly handling user interactions on the chart. Interactions include: mouse scrolling, mouse dragging, and touches.

#### Running the Interactions tests

You can run the interactions tests with the following command:

```bash
./scripts/run-interactions-tests.sh
```

Alternatively, you can run the tests on a specific file like this:

```bash
node ./tests/e2e/interactions/runner.js ./dist/lightweight-charts.standalone.development.js
```
