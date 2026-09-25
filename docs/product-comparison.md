# Product comparison

Lightweight Charts™ does one thing: it draws financial data on a canvas, fast and in a small bundle.
Everything around that — fetching the data, calculating indicators, drawing tools, the interface itself — is yours to build.
TradingView offers several charting products, and they differ mainly in how much of that work they do for you.

|Product|When it fits|
|-|-|
|**Lightweight Charts™**|You have your own data and your own interface, and you want a small open-source library from npm.|
|**[Advanced Charts](https://www.tradingview.com/advanced-charts/)**|You need a ready-made charting application: toolbars, symbol search, [100+ indicators](https://www.tradingview.com/charting-library-docs/latest/ui_elements/indicators/), [drawing tools](https://www.tradingview.com/charting-library-docs/latest/ui_elements/drawings/), and [chart layout saving](https://www.tradingview.com/charting-library-docs/latest/saving_loading/). You connect your data through the [Datafeed API](https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/).|
|**[Trading Platform](https://www.tradingview.com/trading-platform/)**|You build a trading front end and need order tickets, positions, and the Account Manager on top of the chart.|
|**[Widgets](https://www.tradingview.com/widget-docs/)**|You do not have your own data and do not want to write code: you copy a snippet that embeds a TradingView-hosted chart.|

Unlike Lightweight Charts™, Advanced Charts and Trading Platform are not published on npm: [request access](https://www.tradingview.com/charting-library-docs/latest/quick-start/) and you will be invited to a private GitHub repository.
For a feature-by-feature overview of all the products, refer to the [Compare libraries](https://www.tradingview.com/free-charting-libraries/) page.

:::info

None of these products contain market data, except for widgets that display the TradingView data.
In all other cases, use data from your own source or third-party providers.
Note that you cannot connect your data to widgets.

:::

## Moving to Advanced Charts

Lightweight Charts™ and Advanced Charts libraries share no API, so code written for one does not work with the other.
If you outgrow Lightweight Charts™ and move to Advanced Charts, the table below shows what replaces what.

|Functionality|Lightweight Charts™|Advanced Charts|
|-|-|-|
|Create a chart|[`createChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createChart)|[Widget Constructor](https://www.tradingview.com/charting-library-docs/latest/configuration/Widget-Constructor/)|
|Supply data|[`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) and [`update`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#update): you fetch the data, the library never requests anything|[Datafeed API](https://www.tradingview.com/charting-library-docs/latest/connecting_data/Datafeed-API/): the library calls `getBars` with `periodParams` and `subscribeBars`|
|Load history on scroll back|[`subscribeVisibleLogicalRangeChange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#subscribevisiblelogicalrangechange) and prepend the data yourself|`getBars` is called again with the earlier range|
|Switch a timeframe|Not applicable: request another dataset and call [`setData`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#setdata) again|`supported_resolutions` and `resolution`|
|Add an indicator|Calculate the values and plot them as an additional series, as in the [indicator examples](https://tradingview.github.io/lightweight-charts/tutorials/analysis-indicators.md)|[`createStudy`](https://www.tradingview.com/charting-library-docs/latest/custom_studies/) and `studies_overrides`, on top of [100+ built-in indicators](https://www.tradingview.com/charting-library-docs/latest/ui_elements/indicators/).|
|Let a user draw on the chart|Not available. For static annotations, use [`createSeriesMarkers`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createSeriesMarkers) and [`createPriceLine`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#createpriceline); for anything interactive, write a [plugin](https://tradingview.github.io/lightweight-charts/docs/plugins/intro.md) or take one from the [plugin catalog](https://tradingview.github.io/lightweight-charts/plugins)|[`createShape`](https://www.tradingview.com/charting-library-docs/latest/ui_elements/drawings/drawings-api/), `setLineTools`, and the `toolbox` featureset|
|Mark a price level|[`createPriceLine`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#createpriceline)|[`createOrderLine`](https://www.tradingview.com/charting-library-docs/latest/trading_terminal/Trading-Primitives/) and `createPositionLine`|
|Customize the appearance|Options passed to [`createChart`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createChart) and [`addSeries`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#addseries)|`overrides`, including `paneProperties`|
|Symbol search, toolbars, legend|Not available: build your own HTML around the chart|Built in, and switched off through featuresets|
|Save and restore a chart|Not available: the library does not serialize its state, so persist your own options and data|[Saving and loading charts](https://www.tradingview.com/charting-library-docs/latest/saving_loading/)|

---

Documentation for Lightweight Charts™ v5.2 (latest released version).

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
