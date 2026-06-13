# Manual Testing Notes for WTrading

This document supplements `.github/copilot-instructions.md` and should be used especially after changes to MA, High-Low, prediction, plotting, or coordinate-mapping logic.

## Focus areas
Use this checklist after changes to:
- moving averages (MA)
- high/low calculations
- prediction points
- plotted markers
- derived overlay values
- coordinate or rendering logic related to these features

## Core validation principle
A feature is only considered correct if both of these are true:
1. the calculated value is correct
2. the GUI position is correct

A visually plausible demo graph alone is not sufficient proof.

## Manual test checklist

### 1. Value correctness
- Verify the calculated MA / High / Low / prediction value against the expected formula.
- Confirm the value is based on the intended candles only.
- Check whether the rolling window size is correct.
- Check whether the first valid output appears at the correct index.
- Confirm no accidental inclusion of future candles unless intentionally designed.

### 2. Candle/time alignment
- Verify the plotted point or marker is attached to the intended candle.
- Check whether the plotted output is shifted left or right by one bar.
- Confirm that prediction-related points appear on the intended time index.
- Recheck alignment after zooming or changing visible range.

### 3. Price-level alignment
- Verify the plotted point sits at the expected vertical price level.
- Confirm the displayed point matches the actual calculated numeric value.
- Check for rounding issues or coordinate conversion mismatches.
- Validate that price-to-pixel mapping is still correct after code changes.

### 4. Boundary conditions
Test with:
- empty datasets
- 1 data point
- fewer points than the MA window
- exactly the MA window size
- long datasets
- missing or sparse values if supported

Check:
- no NaN leaks into rendering
- no invalid markers are drawn
- no out-of-range access occurs
- first and last visible candles behave correctly

### 5. Visual plausibility
- Compare multiple chart regions, not just one screenshot/demo area.
- Check whether highs/lows visually match the candle structure.
- Confirm prediction markers do not look correct by coincidence only.
- Verify results using more than one dataset when possible.

### 6. Interaction checks
After making changes, also test:
- zoom in / zoom out
- pan left / right
- resizing the chart
- switching datasets or time ranges
- toggling overlays/series if applicable

Confirm that markers and calculated series remain stable during interaction.

## Common failure patterns
Watch specifically for:
- off-by-one indexing
- value correct but marker on wrong candle
- marker on correct candle but wrong price level
- reversed ordering assumptions
- future/past candle confusion
- hidden rounding mismatch between calculation and render position
- demo-only correctness that fails on other datasets

## If uncertain
If there is uncertainty:
- preserve existing behavior where possible
- document the uncertainty clearly
- avoid merging math/rendering changes based on demo validation alone
