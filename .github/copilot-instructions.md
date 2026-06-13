# Copilot Instructions for WTrading

## Project context
- This repository is based on `tradingview/lightweight-charts` and contains custom trading/charting extensions.
- Treat the codebase as **performance-sensitive** and **rendering-sensitive**.
- Prefer small, isolated changes over broad structural refactors.
- Preserve upstream-compatible structure where practical so future syncs/diffs remain manageable.

## Primary goals
When making changes, optimize for:
1. Correct chart behavior
2. Stable rendering performance
3. Backward compatibility
4. Minimal diff size
5. Clear mathematical intent

## Tech expectations
- Prefer **TypeScript-first** changes where types already exist.
- Avoid introducing new dependencies unless explicitly required.
- Reuse existing utilities and patterns before adding new abstractions.
- Keep public interfaces, exported symbols, and option shapes stable unless the task explicitly requires a breaking change.

## Performance rules
This repo renders financial charts, so assume hot paths are sensitive.

- Avoid unnecessary allocations inside render loops.
- Avoid repeated object creation in draw/update paths.
- Avoid deep cloning, repeated array copying, or repeated sorting in frequently called code.
- Prefer simple loops over abstraction-heavy helpers in critical rendering/math paths.
- Do not add logging in hot paths.
- Be cautious with recalculating derived values on every frame or mouse move.
- Memoize or cache only when it actually reduces repeated work and does not create stale-state bugs.

## Rendering rules
- Do not change canvas drawing behavior unless required by the task.
- Preserve pixel alignment and existing rounding behavior unless a visual bug specifically requires change.
- Be careful when modifying:
  - price-to-coordinate transforms
  - time-to-coordinate transforms
  - pane scaling
  - autoscale logic
  - crosshair behavior
  - visible range calculations
- Any rendering change should include a short explanation of expected visual impact.

## Math and indicator rules
This repository includes prediction / average / high-low related logic.

- Treat all math-related code as correctness-sensitive.
- Do not “simplify” formulas unless you can explain why the new formula is equivalent.
- Be careful with:
  - floating-point precision
  - divide-by-zero cases
  - NaN propagation
  - undefined/null data points
  - sparse or missing candles
  - off-by-one indexing in rolling calculations
- For moving averages, highs/lows, or prediction logic:
  - prefer explicit variable names
  - document window assumptions
  - preserve data ordering assumptions
  - verify boundary behavior at the beginning of datasets

## Validation rules for MA / High-Low / Prediction features
- Treat all MA, High-Low, and prediction-related changes as both calculation-sensitive and visualization-sensitive.
- Do not assume a demo graph is sufficient proof of correctness.
- After changing these features, verify:
  - whether plotted points/markers appear at the intended candle/time position
  - whether the plotted price level matches the intended calculated value
  - whether any off-by-one shift exists in rolling windows or future/past indexing
  - whether price values and screen coordinates are mapped correctly
  - whether results remain plausible on more than one dataset
- If there is uncertainty, preserve current behavior and document the uncertainty clearly.
- Prefer explicit validation of both:
  1. calculation correctness
  2. GUI placement correctness

## Upstream/fork maintenance guidance
- This repo appears to diverge from upstream `lightweight-charts`.
- When editing code that likely came from upstream:
  - preserve the surrounding structure and naming style
  - avoid unnecessary formatting-only changes
  - keep diffs easy to compare against upstream
- If a change is fork-specific, isolate it clearly rather than scattering it across unrelated files.

## Refactoring guidance
Allowed:
- small local cleanup
- extracting tiny helper functions when it improves readability without harming performance
- tightening types
- removing obviously dead local code tied to the change

Avoid unless explicitly requested:
- large renames
- moving files
- API redesign
- cross-module architecture changes
- stylistic rewrites
- replacing proven imperative code with abstraction-heavy patterns

## Testing and validation
For every change, prefer the smallest relevant validation.

- Run or update tests closest to the changed behavior.
- If changing math/indicator behavior, validate with edge cases:
  - empty input
  - single-point input
  - exact window-size input
  - larger rolling-series input
  - missing/undefined values if supported
- If changing rendering behavior, describe:
  - what should look different
  - what must remain unchanged
- Do not modify unrelated snapshots, fixtures, or generated outputs.

## File editing behavior
- Match the style of the file you are editing.
- Follow nearby naming conventions before inventing new ones.
- Keep comments concise and only add them where the intent is non-obvious.
- Do not add header comments/license changes unless explicitly requested.

## Pull request expectations
When preparing a PR or summary, include:
- what changed
- why it changed
- whether rendering behavior changed
- whether math/calculation behavior changed
- any API or option-surface impact
- any performance risk or benefit
- any follow-up work that should be separate

## Preferred change style
Prefer:
- narrow patches
- explicit logic
- stable APIs
- measurable behavior changes

Avoid:
- speculative optimizations
- hidden behavioral changes
- mixing refactors with bug fixes
- changing multiple subsystems in one patch unless required

## If uncertain
If the intent is unclear:
- choose the least invasive implementation
- preserve existing behavior by default
- note assumptions clearly in the PR summary or change explanation
