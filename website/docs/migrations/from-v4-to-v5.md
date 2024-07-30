# From v4 to v5

In this document you can find the migration guide from the previous version v4
to v5.

## Watermarks

### Overview of Changes

In the new version of Lightweight Charts, the watermark feature has undergone significant changes:

1. **Extraction from Core**: The watermark functionality has been extracted from the core library.
2. **Re-implementation**: It's now re-implemented as a Pane Primitive (plugin) included within the library.
3. **Improved Tree-shaking**: This change makes the feature more tree-shakeable, potentially reducing bundle sizes for users who don't need watermarks.
4. **Added an Image Watermark Primitive**: In addition to the usual text based watermark, there is now
an image watermark feature provided by the [`ImageWatermark`](/api/classes/ImageWatermark.md) primitive.

If you're currently using the watermark feature, you'll need to make a few adjustments to your code.

### Accessing the New TextWatermark

The TextWatermark primitive is now available as follows:

- **ESM builds**: Import [`TextWatermark`](/api/classes/TextWatermark.md) directly.
- **Standalone script build**: Access via `LightweightCharts.TextWatermark`.

### Changes in Options

The options structure for watermarks has been revised:

1. **Multiple Lines**: The plugin now supports multiple lines of text.
2. **Text Options**: Text-related options are now defined per line within the `lines` property of the options object.

### Attaching the Watermark

To use the Primitive, you need to attach it to a Pane:

1. **Single Pane**: If you're using only one pane, you can easily fetch it using `chart.panes()[0]`.
2. **Multiple Panes**: For charts with multiple panes, you'll need to specify which pane to attach the watermark to.

### Example: Implementing a Text Watermark

Here's a comprehensive example demonstrating how to implement a text watermark in the new version:

```js
const chart = createChart(container, options);
const mainSeries = chart.addLineSeries();
mainSeries.setData(generateData());

const textWatermark = new TextWatermark({
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

const firstPane = chart.panes()[0];
firstPane.attachPrimitive(textWatermark);
```

## Plugin Typings

Some of the plugin types and interfaces have been renamed due to the additional
of Pane Primitives.

- `ISeriesPrimitivePaneView` -> `IPrimitivePaneView`
- `ISeriesPrimitivePaneRenderer` -> `IPrimitivePaneRenderer`
- `SeriesPrimitivePaneViewZOrder` -> `PrimitivePaneViewZOrder`
