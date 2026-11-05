# Sync crosshairs between two charts

```js
function generateData(startValue, startDate) {
	const res = [];
	const time = startDate ?? (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: startValue + i / 5 + 10 * Math.sin(i / 8 + startValue),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// The two charts share the container, one above the other, each in its own
// element. `autoSize` keeps each chart the size of its element.
const container = document.getElementById('container');
container.style.display = 'flex';
container.style.flexDirection = 'column';
const createChartElement = () => {
	const element = document.createElement('div');
	element.style.flex = '1';
	element.style.minHeight = '0';
	container.appendChild(element);
	return element;
};

const chart1 = createChart(
	createChartElement(),
	{
		autoSize: true,
		crosshair: {
			mode: 0,
		},
		timeScale: {
			visible: false,
		},
		layout: {
			textColor: 'black',
			background: { type: 'solid', color: '#fff5f5' },
		},
		grid: {
			vertLines: { color: '#D6DCDE' },
			horzLines: { color: '#D6DCDE' },
		},
	}
);
const mainSeries1 = chart1.addSeries(LineSeries, {
	color: 'rgb(225, 87, 90)',
});

mainSeries1.setData(generateData(0));

const chart2 = createChart(
	createChartElement(),
	{
		autoSize: true,
		layout: {
			textColor: 'black',
			background: { type: 'solid', color: '#f5f5ff' },
		},
		grid: {
			vertLines: { color: '#D6DCDE' },
			horzLines: { color: '#D6DCDE' },
		},
	}
);

const mainSeries2 = chart2.addSeries(LineSeries, {
	color: '#2962FF',
});

mainSeries2.setData(generateData(100));

// The same price scale width on both charts keeps their time axes aligned.
// 70px fits the widest label, so neither scale grows past it.
chart1.priceScale('right').applyOptions({ minimumWidth: 70 });
chart2.priceScale('right').applyOptions({ minimumWidth: 70 });

chart1.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
	chart2.timeScale().setVisibleLogicalRange(timeRange);
});

chart2.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
	chart1.timeScale().setVisibleLogicalRange(timeRange);
});

function getCrosshairDataPoint(series, param) {
	if (!param.time) {
		return null;
	}
	const dataPoint = param.seriesData.get(series);
	return dataPoint || null;
}

function syncCrosshair(chart, series, dataPoint) {
	if (dataPoint) {
		chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
		return;
	}
	chart.clearCrosshairPosition();
}
chart1.subscribeCrosshairMove(param => {
	const dataPoint = getCrosshairDataPoint(mainSeries1, param);
	syncCrosshair(chart2, mainSeries2, dataPoint);
});
chart2.subscribeCrosshairMove(param => {
	const dataPoint = getCrosshairDataPoint(mainSeries2, param);
	syncCrosshair(chart1, mainSeries1, dataPoint);
});
```

## How it works

Two separate charts are kept in step: scrolling or zooming one moves the other, and the crosshair of one is mirrored on the other.

1. Each chart's [`subscribeVisibleLogicalRangeChange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#subscribevisiblelogicalrangechange) handler passes the range to the other chart's [`setVisibleLogicalRange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#setvisiblelogicalrange).
2. Each chart's [`subscribeCrosshairMove`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribecrosshairmove) handler reads the data point under the crosshair.
3. [`setCrosshairPosition`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#setcrosshairposition) puts the other chart's crosshair on the same time. When there is no data point, [`clearCrosshairPosition`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#clearcrosshairposition) removes it.

The upper chart hides its time scale, so the two read as one. Both right price scales get the same [`minimumWidth`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions#minimumwidth), wide enough for the widest label, so the time axes stay aligned while you scroll and zoom.

## Tips

- Syncing by logical range keeps the charts aligned bar for bar. It works when both series have a point at the same times.

## Resources

- [`setCrosshairPosition`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#setcrosshairposition)
- [`subscribeVisibleLogicalRangeChange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#subscribevisiblelogicalrangechange)
- [Time scale: Logical range](https://tradingview.github.io/lightweight-charts/docs/time-scale.md#logical-range)
- Related examples: [Tracking on mobile](https://tradingview.github.io/lightweight-charts/examples/crosshair/tracking-without-long-press.md), [Panes](https://tradingview.github.io/lightweight-charts/examples/panes/multiple-panes.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
