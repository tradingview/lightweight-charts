# From v4 to v5

In this document you can find the migration guide from the previous version v4
to v5.

## Series changes

In v5, we've unified the way series are added to charts to make the API more consistent and to better utilize tree-shaking capabilities of modern JS bundlers. Instead of having separate functions for each series type (like `addLineSeries`, `addCandlestickSeries`, etc.), there is now a single `addSeries` function.

### Migration Steps

Replace all series creation calls with the new `addSeries` syntax. Here's how the migration works for each series type:

Old v4 syntax:

```js
// Example with Line Series in v4
import { createChart } from 'lightweight-charts';
const chart = createChart(container, {});
const lineSeries = chart.addLineSeries({ color: 'red' });
```

New v5 syntax:

```js
// Example with Line Series in v5
import { createChart, LineSeries } from 'lightweight-charts';
const chart = createChart(container, {});
const lineSeries = chart.addSeries(LineSeries, { color: 'red' });
```

### Complete Migration Reference

Here's how to migrate each series type:

| v4 Method | v5 Method |
|-----------|-----------|
| `chart.addLineSeries(options)` | `chart.addSeries(LineSeries, options)` |
| `chart.addAreaSeries(options)` | `chart.addSeries(AreaSeries, options)` |
| `chart.addBarSeries(options)` | `chart.addSeries(BarSeries, options)` |
| `chart.addBaselineSeries(options)` | `chart.addSeries(BaselineSeries, options)` |
| `chart.addCandlestickSeries(options)` | `chart.addSeries(CandlestickSeries, options)` |
| `chart.addHistogramSeries(options)` | `chart.addSeries(HistogramSeries, options)` |

### Usage Examples

ESM (ES Modules):

```js
import { createChart, LineSeries } from 'lightweight-charts';

const chart = createChart(container, {});
const lineSeries = chart.addSeries(LineSeries, { color: 'red' });
```

UMD (Universal Module Definition):

```js
const chart = LightweightCharts.createChart(container, {});
const lineSeries = chart.addSeries(LightweightCharts.LineSeries, { color: 'red' });
```

Note: Make sure to import the specific series type (e.g., `LineSeries`, `AreaSeries`) along with `createChart` when using ES Modules. For UMD builds, all series types are available under the `LightweightCharts` namespace.

## Watermarks

### Overview of Changes

In the new version of Lightweight Charts, the watermark feature has undergone significant changes:

1. **Extraction from Core**: The watermark functionality has been extracted from the core library.
2. **Re-implementation**: It's now re-implemented as a Pane Primitive (plugin) included within the library.
3. **Improved Tree-shaking**: This change makes the feature more tree-shakeable, potentially reducing bundle sizes for users who don't need watermarks.
4. **Added an Image Watermark Primitive**: In addition to the usual text based watermark, there is now
an image watermark feature provided by the [`createImageWatermark`](/api/functions/createImageWatermark.md) plugin.
5. **Series Markers**: The series markers feature has been moved to a separate plugin as well. To create a series marker, use the [`createSeriesMarkers`](/api/functions/createSeriesMarkers.md) function exported from the library.

If you're currently using the watermark feature, you'll need to make a few adjustments to your code.

### Accessing the New TextWatermark

The TextWatermark plugin is now available as follows:

- **ESM builds**: Import [`createTextWatermark`](/api/functions/createTextWatermark.md) directly.
- **Standalone script build**: Access via `LightweightCharts.createTextWatermark`.

### Changes in Options

The options structure for watermarks has been revised:

1. **Multiple Lines**: The plugin now supports multiple lines of text.
2. **Text Options**: Text-related options are now defined per line within the `lines` property of the options object.

### Attaching the Watermark

To use the plugin, you need pass a pane object to the `createTextWatermark` function. The pane object specifies where the watermark should be attached:

1. **Single Pane**: If you're using only one pane, you can easily fetch it using `chart.panes()[0]`.
2. **Multiple Panes**: For charts with multiple panes, you'll need to specify which pane to attach the watermark to.

### Example: Implementing a Text Watermark

Here's a comprehensive example demonstrating how to implement a text watermark in the new version:

```js
const chart = createChart(container, options);
const mainSeries = chart.addSeries(LineSeries);
mainSeries.setData(generateData());

const firstPane = chart.panes()[0];
createTextWatermark(firstPane, {
    horzAlign: 'center',
    vertAlign: 'center',
    lines: [
        {
            text: 'Hello',
            color: 'rgba(255,0,0,0.5)',
            fontSize: 100,
            fontStyle: 'bold',
        },
        {
            text: 'This is a text watermark',
            color: 'rgba(0,0,255,0.5)',
            fontSize: 50,
            fontStyle: 'italic',
            fontFamily: 'monospace',
        },
    ],
});
```

## Plugin Typings

Some of the plugin types and interfaces have been renamed due to the additional
of Pane Primitives.

- `ISeriesPrimitivePaneView` -> `IPrimitivePaneView`
- `ISeriesPrimitivePaneRenderer` -> `IPrimitivePaneRenderer`
- `SeriesPrimitivePaneViewZOrder` -> `PrimitivePaneViewZOrder`
