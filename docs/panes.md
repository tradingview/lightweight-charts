# Panes

Panes are essential elements that help segregate data visually within a single chart.
Panes are useful when you have a chart that needs to show more than one kind of data. For example, you might want to see a stock's price over time in one pane and its trading volume in another. This setup helps users get a fuller picture without cluttering the chart.

By default, Lightweight Charts™ has a single pane, however, you can add more panes to the chart to display different series in separate areas. For detailed examples and code snippets on how to implement panes in your charts [see tutorial](https://tradingview.github.io/lightweight-charts/tutorials/how_to/panes.md).

## Customization Options

Lightweight Charts™ offers a few [customization options](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutPanesOptions) to tailor the appearance and behavior of panes:

- [Pane Separator Color](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutPanesOptions#separatorcolor): Customize the color of the pane separators to match the chart design or improve visibility.

- [Separator Hover Color](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutPanesOptions#separatorhovercolor): Enhance user interaction by changing the color of separators on mouse hover.

- [Resizable Panes](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/LayoutPanesOptions#enableresize): Opt to enable or disable the resizing of panes by the user, offering flexibility in how data is displayed.

## Managing Panes

While the specific methods to manipulate panes are covered in the detailed [example](https://tradingview.github.io/lightweight-charts/tutorials/how_to/panes.md), it's important to note that Lightweight Charts™ provides an [API for pane management](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPaneApi). This includes adding new panes, moving series between panes, adjusting pane height, and removing panes. The API ensures that developers have full control over the pane lifecycle and organization within their charts.

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
