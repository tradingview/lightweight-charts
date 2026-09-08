# Wave-1 plugin regression tests

This is the tests-only follow-up to the plugin stack ending at #2131.
Production fixes are deliberately deferred. The browser and CI regression
commands assert the intended behavior and currently exit nonzero; they do not
accept the broken state as a golden image. Consumer type tests should pass.

## Run

Use the repository's Node and pnpm versions, install workspace dependencies,
then build the published entry points:

```sh
pnpm install --frozen-lockfile
pnpm plugins:build-tests
pnpm plugins:type-tests
pnpm plugins:test-regressions
pnpm plugins:test-ci
```

The browser runner uses Puppeteer. Install its browser with
`pnpm exec puppeteer browsers install chrome`, or set
`PUPPETEER_EXECUTABLE_PATH` to an existing Chrome executable.

Browser results are saved under
`tests/e2e/graphics/.gendata/plugin-regressions/`: open `index.html` for a gallery,
or inspect each case's `actual.png` and `result.json`. Screenshots are kept on
assertion failures and browser errors. Each screenshot includes the expected
and actual result, including nonvisual outcomes such as announced point counts.
Generated `case.html` is diagnostic source; its module URLs belong to the
runner's temporary loopback server, so rerun the command to execute a case.

```sh
# One real mouse interaction, with a separate output directory:
GREP='vertical-line/regression-' CMP_OUT_DIR=/tmp/line-regression pnpm plugins:test-regressions
# Production library at Retina resolution:
PRODUCTION_BUILD=true DEVICE_PIXEL_RATIO=2 pnpm plugins:test-regressions
```

All `regression-*.js` cases also participate in the existing comparative plugin
graphics suite. The dedicated assertion runner is useful before golden plugin
builds exist: it uses the same page generation, discovery, and mouse actions,
and requires every recorded check to pass. It never writes golden files.

## Coverage of the review findings

Paths below are relative to `packages/`; browser cases live in each package's
`tests/graphics/` directory. Several findings affect multiple plugins, giving
14 browser cases for ten runtime findings.

| Finding | Package and case | Intended result |
| --- | --- | --- |
| 1 | `lwc-plugin-stacked-area-series/regression-interior-viewport.js`; `lwc-plugin-brushable-area-series/regression-interior-viewport.js` | Filled areas remain visible when the initial viewport is inside the data set. |
| 2 | `lwc-plugin-dual-range-histogram-series/regression-initial-autoscale.js`; `lwc-plugin-pretty-histogram-series/regression-initial-autoscale.js` | Initial autoscale includes a nondefault baseline and column endpoints. |
| 3 | `lwc-plugin-vertical-line/regression-drag-restores-chart.js` | A real drag moves the line and restores the original scroll/scale settings. |
| 4 | `lwc-plugin-hlc-area-series/regression-conflation.js`; `lwc-plugin-stacked-area-series/regression-conflation.js` | The chart actually conflates the data and the area stays filled. |
| 5 | `tests/plugin-regressions/ci.spec.mjs`, graphics fixture (repository-relative path) | The merge-base build produces a golden for a plugin that already exists there. |
| 6 | `tests/plugin-regressions/ci.spec.mjs`, unit-job fixture (repository-relative path) | Accessibility tests import successfully using only restored CI artifacts and declared preparation commands. |
| 7 | `lwc-plugin-stacked-bars-series/regression-small-radius-thick-border.js` | Valid small-radius/thick-border options paint columns without a canvas exception. |
| 8 | `lwc-plugin-brushable-area-series/regression-selection-survives-leave.js` | A completed mouse selection survives a subsequent pointer exit. |
| 9 | `lwc-plugin-stacked-bars-series/regression-reverse-negative-autoscale.js` | The lowest endpoint of a reversed mixed-sign stack stays inside the pane. |
| 10 | `lwc-plugin-accessibility/regression-business-day-count.js`; `lwc-plugin-accessibility/regression-pop-count.js` | Announced counts match the real length after replacing a BusinessDay point or removing points. |
| 11 | `lwc-plugin-accessibility/regression-historical-update.js` | Keyboard navigation reads a corrected historical value. |
| 12 | `lwc-plugin-rounded-candles-series/regression-inverted-wicks.js` | Inverting the price scale preserves candle wicks. |

The graphics CI fixture runs the real shell pipeline in a temporary directory
with tiny stand-ins for checkout and compilation. It models a merge base that
already contains plugins, distinguishing the defect from intentionally missing
pre-graduation goldens. The unit-job fixture copies sources and declared
persisted artifacts, executes the job's inline commands against a representative
accessibility test, and proves that test works after a control toolkit build.
Neither fixture checks out another revision or removes working-tree outputs.

## Consumer type coverage

Every plugin has `tests/type-checks/api.ts` and a separate strict TypeScript
configuration. Imports use its package name and `/standalone` exports, resolving
the generated `dist/*.d.ts` files with NodeNext resolution. There are no source
path aliases or skipped declaration checks.

The cases cover inferred series options and returned data, custom horizontal
scales, extended user data, primitive attachment, partial options, callback
arguments, read-only results, and retained legacy aliases. Exact type assertions
catch accidental widening to `any`; `@ts-expect-error` checks ensure invalid
inputs remain rejected. These files are compiled only, never executed.

After implementing fixes, rerun both regression commands until they pass, review
the changed screenshots, and then update graphics goldens through the usual
review process. The new commands are separate from the existing unit/type jobs
so this tests-only checkpoint does not turn every CI job into an expected failure.
