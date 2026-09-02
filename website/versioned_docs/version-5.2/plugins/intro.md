---
sidebar_label: Overview
sidebar_position: 0
---

# Plugin development

**Plugins** let you extend Lightweight Charts™ with your own functionality: new
series types, drawing tools, indicators, watermarks, and other custom elements
rendered as part of the chart. This section explains how plugins work and how
to build your own.

## Choosing a plugin type

| You want to build | Plugin type | Attach with |
| --- | --- | --- |
| A drawing tool, annotation, or overlay tied to a series and its scales | [Series primitive](./series-primitives.mdx) | [`ISeriesApi.attachPrimitive`](../api/interfaces/ISeriesApi.md#attachprimitive) |
| A pane-wide element independent of any series, such as a watermark | [Pane primitive](./pane-primitives.md) | [`IPaneApi.attachPrimitive`](../api/interfaces/IPaneApi.md#attachprimitive) |
| A new way to draw data: a series with its own data structure and rendering | [Custom series](./custom_series.md) | [`addCustomSeries`](../api/interfaces/IChartApi.md#addcustomseries) |

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
   [Canvas rendering target](./canvas-rendering-target.md), and keep lines
   crisp with the [Pixel perfect rendering](./pixel-perfect-rendering/index.md)
   techniques.
4. **Learn from working code.** The
   [Plugin examples demo](https://tradingview.github.io/lightweight-charts/plugin-examples)
   hosts interactive examples of heatmaps, alerts, watermarks, and tooltips;
   their sources live in the
   [`plugin-examples`](https://github.com/tradingview/lightweight-charts/tree/master/plugin-examples)
   folder of the repository.
