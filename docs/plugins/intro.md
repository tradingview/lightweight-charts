# Plugin development

**Plugins** let you extend Lightweight Charts™ with your own functionality: new
series types, drawing tools, indicators, watermarks, and other custom elements
rendered as part of the chart. This section explains how plugins work and how
to build your own.

## Choosing a plugin type

| You want to build | Plugin type | Attach with |
| --- | --- | --- |
| A drawing tool, annotation, or overlay tied to a series and its scales | [Series primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/series-primitives.md) | [`ISeriesApi.attachPrimitive`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#attachprimitive) |
| A pane-wide element independent of any series, such as a watermark | [Pane primitive](https://tradingview.github.io/lightweight-charts/docs/plugins/pane-primitives.md) | [`IPaneApi.attachPrimitive`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPaneApi#attachprimitive) |
| A new way to draw data: a series with its own data structure and rendering | [Custom series](https://tradingview.github.io/lightweight-charts/docs/plugins/custom_series.md) | [`addCustomSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addcustomseries) |

:::tip

If your element visualizes its own data, build a custom series;
if it decorates a series or reacts to its scales, build a series primitive;
if it belongs to the pane as a whole, build a pane primitive.
Series primitives can also render on the price and time scales; pane primitives cannot.

:::

## Development workflow

1. **Scaffold a project.** Run `npm create lwc-plugin@latest` — the
   [create-lwc-plugin](https://www.npmjs.com/package/create-lwc-plugin)
   package generates a ready-to-run project for the plugin type you choose.
2. **Implement the plugin interface.** Follow the article for your plugin type
   from the table above.
3. **Render on the canvas.** Draw in the right coordinate space with
   [Canvas rendering target](https://tradingview.github.io/lightweight-charts/docs/plugins/canvas-rendering-target.md), and keep lines
   crisp with the [Pixel perfect rendering](https://tradingview.github.io/lightweight-charts/docs/plugins/pixel-perfect-rendering.md)
   techniques.
4. **Learn from working code.** The
   [Plugin examples demo](https://tradingview.github.io/lightweight-charts/plugin-examples)
   hosts interactive examples of heatmaps, alerts, watermarks, and tooltips;
   their sources live in the
   [`plugin-examples`](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples)
   folder of the repository.

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
