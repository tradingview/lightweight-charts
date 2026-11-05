# Tracking without long-press

```js
function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 100 + i / 5 + 10 * Math.sin(i / 8),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

const chart = createChart(
	document.getElementById('container'),
	{
		layout: {
			textColor: 'black',
			background: { type: 'solid', color: 'white' },
		},
		grid: {
			vertLines: { color: '#D6DCDE' },
			horzLines: { color: '#D6DCDE' },
		},
		handleScale: false,
		handleScroll: false,
	}
);

const mainSeries = chart.addSeries(LineSeries, {
	color: '#2962FF',
	priceFormat: {
		minMove: 1,
		precision: 0,
	},
});

mainSeries.setData(generateData());

chart.timeScale().fitContent();

document.getElementById('container').addEventListener('touchmove', e => {
	const bcr = document.getElementById('container').getBoundingClientRect();
	// Touch coordinates are relative to the viewport; the chart's are relative to the container.
	const x = e.touches[0].clientX - bcr.left;
	const y = e.touches[0].clientY - bcr.top;

	const price = mainSeries.coordinateToPrice(y);
	const time = chart.timeScale().coordinateToTime(x);

	if (!Number.isFinite(price) || !Number.isFinite(time)) {
		return;
	}

	chart.setCrosshairPosition(price, time, mainSeries);
});

document.getElementById('container').addEventListener('touchend', () => {
	chart.clearCrosshairPosition();
});
```

## How it works

On touch screens the crosshair appears after a long press, because a plain swipe scrolls the chart. With scrolling and scaling turned off, the crosshair can follow the finger right away.

1. `handleScroll: false` and `handleScale: false` in the chart options free touch moves from scrolling.
2. A `touchmove` listener on the container converts the touch position to a price with [`coordinateToPrice`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#coordinatetoprice) and to a time with [`coordinateToTime`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#coordinatetotime).
3. [`setCrosshairPosition`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#setcrosshairposition) moves the crosshair there. A `touchend` listener clears it with [`clearCrosshairPosition`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#clearcrosshairposition).

Open the page on a phone, or in a browser's device mode, to try it.

## Resources

- [`setCrosshairPosition`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#setcrosshairposition)
- [`HandleScrollOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/HandleScrollOptions)
- Related examples: [Sync two charts](https://tradingview.github.io/lightweight-charts/examples/crosshair/sync-crosshairs.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
