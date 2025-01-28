# From v4 to v5

In this document you can find the migration guide from the previous version v4
to v5.

## Table of Contents

- [Series changes](#series-changes)
- [Series Markers](#series-markers)
- [Watermarks](#watermarks)
- [Plugin Typings](#plugin-typings)

## Series changes

### Overview of Changes {#overview-changes-series}

- Unified series creation API using single `addSeries` function
- Better tree-shaking support
- Individual series types must now be imported separately (for ESM)

### Migration Steps {#migration-steps-series}

Replace all series creation calls with the new `addSeries` syntax. Here's how the migration works for each series type:

#### Before (v4) {#v4-series}

```js
// Example with Line Series in v4
import { createChart } from 'lightweight-charts';
const chart = createChart(container, {});
const lineSeries = chart.addLineSeries({ color: 'red' });
```

#### After (v5) {#v5-series}

```js
// Example with Line Series in v5
import { createChart, LineSeries } from 'lightweight-charts';
const chart = createChart(container, {});
const lineSeries = chart.addSeries(LineSeries, { color: 'red' });
```

#### Migration Reference {#migration-reference-series}

Here's how to migrate each series type:

| v4 Method | v5 Method |
|-----------|-----------|
| `chart.addLineSeries(options)` | `chart.addSeries(LineSeries, options)` |
| `chart.addAreaSeries(options)` | `chart.addSeries(AreaSeries, options)` |
| `chart.addBarSeries(options)` | `chart.addSeries(BarSeries, options)` |
| `chart.addBaselineSeries(options)` | `chart.addSeries(BaselineSeries, options)` |
| `chart.addCandlestickSeries(options)` | `chart.addSeries(CandlestickSeries, options)` |
| `chart.addHistogramSeries(options)` | `chart.addSeries(HistogramSeries, options)` |

### Usage Examples {#usage-examples-series}

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

## Series Markers

### Overview of Changes {#overview-changes-markers}

- Markers moved to separate primitive for optimized bundle size
- New ⁠`createSeriesMarkers` function required
- Marker management through dedicated primitive instance

### Migration Steps {#migration-steps-markers}

#### Before (v4) {#v4-markers}

```javascript
// Markers were directly managed through the series instance
series.setMarkers([
    {
        time: '2019-04-09',
        position: 'aboveBar',
        color: 'black',
        shape: 'arrowDown',
    },
]);

// Getting markers
const markers = series.markers();
```

#### After (v5) {#v5-markers}

```javascript
// Import the markers primitive
import { createSeriesMarkers } from 'lightweight-charts';

// Create a markers primitive instance
const seriesMarkers = createSeriesMarkers(series, [
    {
        time: '2019-04-09',
        position: 'aboveBar',
        color: 'black',
        shape: 'arrowDown',
    },
]);

// Getting markers
const markers = seriesMarkers.markers();

// Updating markers
seriesMarkers.setMarkers([/* new markers */]);

// Remove all markers
seriesMarkers.setMarkers([]);
```

### Key Changes {#key-changes-markers}

- You must now import `createSeriesMarkers` separately
- Instead of calling methods directly on the series instance, create a markers primitive using `createSeriesMarkers`
- The markers API is now accessed through the markers primitive instance
- The marker configuration object format remains the same
- This change results in smaller bundle sizes when markers aren't used

If your application doesn't use markers, you can now benefit from a smaller bundle size as this functionality is no longer included in the core package.

## Watermarks

### Overview of Changes {#overview-changes-watermarks}

In the new version of Lightweight Charts, the watermark feature has undergone significant changes:

- Extraction from Core: The watermark functionality has been extracted from the core library.
- Re-implementation: It's now re-implemented as a Pane Primitive (plugin) included within the library.
- Improved Tree-shaking: This change makes the feature more tree-shakeable, potentially reducing bundle sizes for users who don't need watermarks.
- Added an Image Watermark Primitive: In addition to the usual text based watermark, there is now
an image watermark feature provided by the [`createImageWatermark`](/api/functions/createImageWatermark.md) plugin.

### Migration Steps {#migration-steps-watermarks}

#### Before (v4) {#v4-watermarks}

```js
const chart = createChart(container, {
    watermark: {
        text: 'Watermark Text',
        color: 'rgba(255,0,0,0.5)',
    },
});
```

#### After (v5) {#v5-watermarks}

```js
import { createChart, createTextWatermark } from 'lightweight-charts';

const chart = createChart(container, options);
const firstPane = chart.panes()[0];

createTextWatermark(firstPane, {
    horzAlign: 'center',
    vertAlign: 'center',
    lines: [{
        text: 'Watermark Text',
        color: 'rgba(255,0,0,0.5)',
        fontSize: 50,
    }],
});

```

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

### Overview of Changes {#overview-changes-plugins}

Some of the plugin types and interfaces have been renamed due to the additional
of Pane Primitives.

- `ISeriesPrimitivePaneView` → `IPrimitivePaneView`
- `ISeriesPrimitivePaneRenderer` → `IPrimitivePaneRenderer`
- `SeriesPrimitivePaneViewZOrder` → `PrimitivePaneViewZOrder`
