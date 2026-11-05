# Text watermark

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
	grid: {
		vertLines: { color: '#D6DCDE' },
		horzLines: { color: '#D6DCDE' },
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

createTextWatermark(chart.panes()[0], {
	horzAlign: 'center',
	vertAlign: 'center',
	lines: [
		{
			text: 'Watermark Example',
			color: 'rgba(171, 71, 188, 0.5)',
			fontSize: 24,
		},
	],
});

const lineSeries = chart.addSeries(AreaSeries, {
	topColor: '#2962FF',
	bottomColor: 'rgba(41, 98, 255, 0.28)',
	lineColor: '#2962FF',
	lineWidth: 2,
});

const data = [
	{ value: 0, time: 1642425322 },
	{ value: 8, time: 1642511722 },
	{ value: 10, time: 1642598122 },
	{ value: 20, time: 1642684522 },
	{ value: 3, time: 1642770922 },
	{ value: 43, time: 1642857322 },
	{ value: 41, time: 1642943722 },
	{ value: 43, time: 1643030122 },
	{ value: 56, time: 1643116522 },
	{ value: 46, time: 1643202922 },
];

lineSeries.setData(data);

chart.timeScale().fitContent();
```

## How it works

A text watermark is one or more lines of text drawn behind the series in a pane.

[`createTextWatermark`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createTextWatermark) adds the watermark to the first pane, from [`panes`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#panes). The options set its alignment and, for each line, the text, color, and font size. The call is highlighted in the code.

## Tips

- The function returns the watermark. Call its `applyOptions` to change the text later.
- For an image instead of text, see [Image watermark](https://tradingview.github.io/lightweight-charts/examples/styling/image-watermark.md).

## Resources

- [`createTextWatermark`](https://tradingview.github.io/lightweight-charts/docs/api/functions/createTextWatermark)
- [`TextWatermarkOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TextWatermarkOptions)
- Related examples: [Image watermark](https://tradingview.github.io/lightweight-charts/examples/styling/image-watermark.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
