# Tooltips

Lightweight Charts™ doesn't include a built-in tooltip feature, however it is something which can be added
to your chart by following the examples presented below.

## How to

In order to add a tooltip to the chart we need to create and position an `html` into the desired position above
the chart. We can then subscribe to the crosshairMove events ([subscribeCrosshairMove](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribecrosshairmove)) provided by the [`IChartApi`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi) instance, and manually
update the content within our `html` tooltip element and change it's position.

```js
chart.subscribeCrosshairMove(param => {
    if (
        param.point === undefined ||
		!param.time ||
		param.point.x < 0 ||
		param.point.y < 0
    ) {
        toolTip.style.display = 'none';
    } else {
        const dateStr = dateToString(param.time);
        toolTip.style.display = 'block';
        const data = param.seriesData.get(series);
        const price = data.value !== undefined ? data.value : data.close;
        toolTip.innerHTML = `<div>${price.toFixed(2)}</div>`;

        // Position tooltip according to mouse cursor position
        toolTip.style.left = param.point.x + 'px';
        toolTip.style.top = param.point.y + 'px';
    }
});
```

The process of creating the tooltip html element and positioning can be seen within the examples below.
Essentially, we create a new div element within the container div (holding the chart) and then position
and style it using `css`.

You can see full [working examples](#examples) below.

### Getting the mouse cursors position

The parameter object ([MouseEventParams Interface](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/MouseEventParams)) passed to the
crosshairMove handler function ([MouseEventhandler](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/MouseEventHandler)) contains a
[point](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/Point) property which gives the current mouse cursor position relative to
the top left corner of the chart.

### Getting the data points position

It is possible to convert a price value into it's current vertical position on the chart by using
the [priceToCoordinate](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#pricetocoordinate) method on the series' instance.
This along with the `param.point.x` can be used to determine the position of the data point.

```js
chart.subscribeCrosshairMove(param => {
    const x = param.point.x;
    const data = param.seriesData.get(series);
    const price = data.value !== undefined ? data.value : data.close;
    const y = series.priceToCoordinate(price);
    console.log(`The data point is at position: ${x}, ${y}`);
});
```

## Resources

- [subscribeCrosshairMove](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribecrosshairmove)
- [MouseEventParams Interface](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/MouseEventParams)
- [MouseEventhandler](https://tradingview.github.io/lightweight-charts/docs/api/type-aliases/MouseEventHandler)
- [priceToCoordinate](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ISeriesApi#pricetocoordinate)

Below are a few external resources related to creating and styling html elements:

- [createElement](https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement)
- [innerHTML](https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML)
- [style property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/style)

## Examples

**How to use the code sample**

The code presented below requires:

- That `createChart` has already been imported. See [Getting Started](https://tradingview.github.io/lightweight-charts/docs.md#creating-a-chart) for more information,
- and that there is an html div element on the page with an `id` of `container`.

Here is an example skeleton setup: [Code Sandbox](https://codesandbox.io/s/lightweight-charts-skeleton-n67pm6).
You can paste the provided code below the `// REPLACE EVERYTHING BELOW HERE` comment.

:::tip

Some code may be hidden to improve readability. Toggle the checkbox above the code block to reveal all the code.

:::

### Floating Tooltip

The floating tooltip in this example will position itself next to the current datapoint.

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

chart.applyOptions({
	crosshair: {
		// hide the horizontal crosshair line
		horzLine: {
			visible: false,
			labelVisible: false,
		},
		// hide the vertical crosshair label
		vertLine: {
			labelVisible: false,
		},
	},
	// hide the grid lines
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
});
const series = chart.addSeries(AreaSeries, {
	topColor: '#2962FF',
	bottomColor: 'rgba(41, 98, 255, 0.28)',
	lineColor: '#2962FF',
	lineWidth: 2,
	crossHairMarkerVisible: false,
});
series.priceScale().applyOptions({
	scaleMargins: {
		top: 0.3, // leave some space for the legend
		bottom: 0.25,
	},
});

series.setData([
	{ time: '2018-10-19', value: 26.19 },
	{ time: '2018-10-22', value: 25.87 },
	{ time: '2018-10-23', value: 25.83 },
	{ time: '2018-10-24', value: 25.78 },
	{ time: '2018-10-25', value: 25.82 },
	{ time: '2018-10-26', value: 25.81 },
	{ time: '2018-10-29', value: 25.82 },
	{ time: '2018-10-30', value: 25.71 },
	{ time: '2018-10-31', value: 25.82 },
	{ time: '2018-11-01', value: 25.72 },
	{ time: '2018-11-02', value: 25.74 },
	{ time: '2018-11-05', value: 25.81 },
	{ time: '2018-11-06', value: 25.75 },
	{ time: '2018-11-07', value: 25.73 },
	{ time: '2018-11-08', value: 25.75 },
	{ time: '2018-11-09', value: 25.75 },
	{ time: '2018-11-12', value: 25.76 },
	{ time: '2018-11-13', value: 25.8 },
	{ time: '2018-11-14', value: 25.77 },
	{ time: '2018-11-15', value: 25.75 },
	{ time: '2018-11-16', value: 25.75 },
	{ time: '2018-11-19', value: 25.75 },
	{ time: '2018-11-20', value: 25.72 },
	{ time: '2018-11-21', value: 25.78 },
	{ time: '2018-11-23', value: 25.72 },
	{ time: '2018-11-26', value: 25.78 },
	{ time: '2018-11-27', value: 25.85 },
	{ time: '2018-11-28', value: 25.85 },
	{ time: '2018-11-29', value: 25.55 },
	{ time: '2018-11-30', value: 25.41 },
	{ time: '2018-12-03', value: 25.41 },
	{ time: '2018-12-04', value: 25.42 },
	{ time: '2018-12-06', value: 25.33 },
	{ time: '2018-12-07', value: 25.39 },
	{ time: '2018-12-10', value: 25.32 },
	{ time: '2018-12-11', value: 25.48 },
	{ time: '2018-12-12', value: 25.39 },
	{ time: '2018-12-13', value: 25.45 },
	{ time: '2018-12-14', value: 25.52 },
	{ time: '2018-12-17', value: 25.38 },
	{ time: '2018-12-18', value: 25.36 },
	{ time: '2018-12-19', value: 25.65 },
	{ time: '2018-12-20', value: 25.7 },
	{ time: '2018-12-21', value: 25.66 },
	{ time: '2018-12-24', value: 25.66 },
	{ time: '2018-12-26', value: 25.65 },
	{ time: '2018-12-27', value: 25.66 },
	{ time: '2018-12-28', value: 25.68 },
	{ time: '2018-12-31', value: 25.77 },
	{ time: '2019-01-02', value: 25.72 },
	{ time: '2019-01-03', value: 25.69 },
	{ time: '2019-01-04', value: 25.71 },
	{ time: '2019-01-07', value: 25.72 },
	{ time: '2019-01-08', value: 25.72 },
	{ time: '2019-01-09', value: 25.66 },
	{ time: '2019-01-10', value: 25.85 },
	{ time: '2019-01-11', value: 25.92 },
	{ time: '2019-01-14', value: 25.94 },
	{ time: '2019-01-15', value: 25.95 },
	{ time: '2019-01-16', value: 26.0 },
	{ time: '2019-01-17', value: 25.99 },
	{ time: '2019-01-18', value: 25.6 },
	{ time: '2019-01-22', value: 25.81 },
	{ time: '2019-01-23', value: 25.7 },
	{ time: '2019-01-24', value: 25.74 },
	{ time: '2019-01-25', value: 25.8 },
	{ time: '2019-01-28', value: 25.83 },
	{ time: '2019-01-29', value: 25.7 },
	{ time: '2019-01-30', value: 25.78 },
	{ time: '2019-01-31', value: 25.35 },
	{ time: '2019-02-01', value: 25.6 },
	{ time: '2019-02-04', value: 25.65 },
	{ time: '2019-02-05', value: 25.73 },
	{ time: '2019-02-06', value: 25.71 },
	{ time: '2019-02-07', value: 25.71 },
	{ time: '2019-02-08', value: 25.72 },
	{ time: '2019-02-11', value: 25.76 },
	{ time: '2019-02-12', value: 25.84 },
	{ time: '2019-02-13', value: 25.85 },
	{ time: '2019-02-14', value: 25.87 },
	{ time: '2019-02-15', value: 25.89 },
	{ time: '2019-02-19', value: 25.9 },
	{ time: '2019-02-20', value: 25.92 },
	{ time: '2019-02-21', value: 25.96 },
	{ time: '2019-02-22', value: 26.0 },
	{ time: '2019-02-25', value: 25.93 },
	{ time: '2019-02-26', value: 25.92 },
	{ time: '2019-02-27', value: 25.67 },
	{ time: '2019-02-28', value: 25.79 },
	{ time: '2019-03-01', value: 25.86 },
	{ time: '2019-03-04', value: 25.94 },
	{ time: '2019-03-05', value: 26.02 },
	{ time: '2019-03-06', value: 25.95 },
	{ time: '2019-03-07', value: 25.89 },
	{ time: '2019-03-08', value: 25.94 },
	{ time: '2019-03-11', value: 25.91 },
	{ time: '2019-03-12', value: 25.92 },
	{ time: '2019-03-13', value: 26.0 },
	{ time: '2019-03-14', value: 26.05 },
	{ time: '2019-03-15', value: 26.11 },
	{ time: '2019-03-18', value: 26.1 },
	{ time: '2019-03-19', value: 25.98 },
	{ time: '2019-03-20', value: 26.11 },
	{ time: '2019-03-21', value: 26.12 },
	{ time: '2019-03-22', value: 25.88 },
	{ time: '2019-03-25', value: 25.85 },
	{ time: '2019-03-26', value: 25.72 },
	{ time: '2019-03-27', value: 25.73 },
	{ time: '2019-03-28', value: 25.8 },
	{ time: '2019-03-29', value: 25.77 },
	{ time: '2019-04-01', value: 26.06 },
	{ time: '2019-04-02', value: 25.93 },
	{ time: '2019-04-03', value: 25.95 },
	{ time: '2019-04-04', value: 26.06 },
	{ time: '2019-04-05', value: 26.16 },
	{ time: '2019-04-08', value: 26.12 },
	{ time: '2019-04-09', value: 26.07 },
	{ time: '2019-04-10', value: 26.13 },
	{ time: '2019-04-11', value: 26.04 },
	{ time: '2019-04-12', value: 26.04 },
	{ time: '2019-04-15', value: 26.05 },
	{ time: '2019-04-16', value: 26.01 },
	{ time: '2019-04-17', value: 26.09 },
	{ time: '2019-04-18', value: 26.0 },
	{ time: '2019-04-22', value: 26.0 },
	{ time: '2019-04-23', value: 26.06 },
	{ time: '2019-04-24', value: 26.0 },
	{ time: '2019-04-25', value: 25.81 },
	{ time: '2019-04-26', value: 25.88 },
	{ time: '2019-04-29', value: 25.91 },
	{ time: '2019-04-30', value: 25.9 },
	{ time: '2019-05-01', value: 26.02 },
	{ time: '2019-05-02', value: 25.97 },
	{ time: '2019-05-03', value: 26.02 },
	{ time: '2019-05-06', value: 26.03 },
	{ time: '2019-05-07', value: 26.04 },
	{ time: '2019-05-08', value: 26.05 },
	{ time: '2019-05-09', value: 26.05 },
	{ time: '2019-05-10', value: 26.08 },
	{ time: '2019-05-13', value: 26.05 },
	{ time: '2019-05-14', value: 26.01 },
	{ time: '2019-05-15', value: 26.03 },
	{ time: '2019-05-16', value: 26.14 },
	{ time: '2019-05-17', value: 26.09 },
	{ time: '2019-05-20', value: 26.01 },
	{ time: '2019-05-21', value: 26.12 },
	{ time: '2019-05-22', value: 26.15 },
	{ time: '2019-05-23', value: 26.18 },
	{ time: '2019-05-24', value: 26.16 },
	{ time: '2019-05-28', value: 26.23 },
]);

const container = document.getElementById('container');

const toolTipWidth = 80;
const toolTipHeight = 80;
const toolTipMargin = 15;

// Create and style the tooltip html element
const toolTip = document.createElement('div');
toolTip.style = `width: 96px; height: 80px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
toolTip.style.background = 'white';
toolTip.style.color = 'black';
toolTip.style.borderColor = '#2962FF';
container.appendChild(toolTip);

// update tooltip
chart.subscribeCrosshairMove(param => {
	if (
		param.point === undefined ||
		!param.time ||
		param.point.x < 0 ||
		param.point.x > container.clientWidth ||
		param.point.y < 0 ||
		param.point.y > container.clientHeight
	) {
		toolTip.style.display = 'none';
	} else {
		// time will be in the same format that we supplied to setData.
		// thus it will be YYYY-MM-DD
		const dateStr = param.time;
		toolTip.style.display = 'block';
		const data = param.seriesData.get(series);
		const price = data.value !== undefined ? data.value : data.close;
		toolTip.innerHTML = `<div style="color: ${'#2962FF'}">Apple Inc.</div><div style="font-size: 24px; margin: 4px 0px; color: ${'black'}">
			${Math.round(100 * price) / 100}
			</div><div style="color: ${'black'}">
			${dateStr}
			</div>`;

		const coordinate = series.priceToCoordinate(price);
		let shiftedCoordinate = param.point.x - 50;
		if (coordinate === null) {
			return;
		}
		shiftedCoordinate = Math.max(
			0,
			Math.min(container.clientWidth - toolTipWidth, shiftedCoordinate)
		);
		const coordinateY =
			coordinate - toolTipHeight - toolTipMargin > 0
				? coordinate - toolTipHeight - toolTipMargin
				: Math.max(
					0,
					Math.min(
						container.clientHeight - toolTipHeight - toolTipMargin,
						coordinate + toolTipMargin
					)
				);
		toolTip.style.left = shiftedCoordinate + 'px';
		toolTip.style.top = coordinateY + 'px';
	}
});

chart.timeScale().fitContent();
```

### Tracking Tooltip

The tracking tooltip will position itself next to the user's cursor.

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

chart.applyOptions({
	rightPriceScale: {
		scaleMargins: {
			top: 0.3, // leave some space for the legend
			bottom: 0.25,
		},
	},
	crosshair: {
		// hide the horizontal crosshair line
		horzLine: {
			visible: false,
			labelVisible: false,
		},
		// hide the vertical crosshair label
		vertLine: {
			labelVisible: false,
		},
	},
	// hide the grid lines
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
});

const series = chart.addSeries(AreaSeries, {
	topColor: 'rgba( 38, 166, 154, 0.28)',
	bottomColor: 'rgba( 38, 166, 154, 0.05)',
	lineColor: 'rgba( 38, 166, 154, 1)',
	lineWidth: 2,
	crossHairMarkerVisible: false,
});

series.setData([
	{ time: '2016-07-18', value: 98.66 },
	{ time: '2016-07-25', value: 104.21 },
	{ time: '2016-08-01', value: 107.48 },
	{ time: '2016-08-08', value: 108.18 },
	{ time: '2016-08-15', value: 109.36 },
	{ time: '2016-08-22', value: 106.94 },
	{ time: '2016-08-29', value: 107.73 },
	{ time: '2016-09-05', value: 103.13 },
	{ time: '2016-09-12', value: 114.92 },
	{ time: '2016-09-19', value: 112.71 },
	{ time: '2016-09-26', value: 113.05 },
	{ time: '2016-10-03', value: 114.06 },
	{ time: '2016-10-10', value: 117.63 },
	{ time: '2016-10-17', value: 116.6 },
	{ time: '2016-10-24', value: 113.72 },
	{ time: '2016-10-31', value: 108.84 },
	{ time: '2016-11-07', value: 108.43 },
	{ time: '2016-11-14', value: 110.06 },
	{ time: '2016-11-21', value: 111.79 },
	{ time: '2016-11-28', value: 109.9 },
	{ time: '2016-12-05', value: 113.95 },
	{ time: '2016-12-12', value: 115.97 },
	{ time: '2016-12-19', value: 116.52 },
	{ time: '2016-12-26', value: 115.82 },
	{ time: '2017-01-02', value: 117.91 },
	{ time: '2017-01-09', value: 119.04 },
	{ time: '2017-01-16', value: 120.0 },
	{ time: '2017-01-23', value: 121.95 },
	{ time: '2017-01-30', value: 129.08 },
	{ time: '2017-02-06', value: 132.12 },
	{ time: '2017-02-13', value: 135.72 },
	{ time: '2017-02-20', value: 136.66 },
	{ time: '2017-02-27', value: 139.78 },
	{ time: '2017-03-06', value: 139.14 },
	{ time: '2017-03-13', value: 139.99 },
	{ time: '2017-03-20', value: 140.64 },
	{ time: '2017-03-27', value: 143.66 },
	{ time: '2017-04-03', value: 143.34 },
	{ time: '2017-04-10', value: 141.05 },
	{ time: '2017-04-17', value: 142.27 },
	{ time: '2017-04-24', value: 143.65 },
	{ time: '2017-05-01', value: 148.96 },
	{ time: '2017-05-08', value: 156.1 },
	{ time: '2017-05-15', value: 153.06 },
	{ time: '2017-05-22', value: 153.61 },
	{ time: '2017-05-29', value: 155.45 },
	{ time: '2017-06-05', value: 148.98 },
	{ time: '2017-06-12', value: 142.27 },
	{ time: '2017-06-19', value: 146.28 },
	{ time: '2017-06-26', value: 144.02 },
	{ time: '2017-07-03', value: 144.18 },
	{ time: '2017-07-10', value: 149.04 },
	{ time: '2017-07-17', value: 150.27 },
	{ time: '2017-07-24', value: 149.5 },
	{ time: '2017-07-31', value: 156.39 },
	{ time: '2017-08-07', value: 157.48 },
	{ time: '2017-08-14', value: 157.5 },
	{ time: '2017-08-21', value: 159.86 },
	{ time: '2017-08-28', value: 164.05 },
	{ time: '2017-09-04', value: 158.63 },
	{ time: '2017-09-11', value: 159.88 },
	{ time: '2017-09-18', value: 151.89 },
	{ time: '2017-09-25', value: 154.12 },
	{ time: '2017-10-02', value: 155.3 },
	{ time: '2017-10-09', value: 156.99 },
	{ time: '2017-10-16', value: 156.25 },
	{ time: '2017-10-23', value: 163.05 },
	{ time: '2017-10-30', value: 172.5 },
	{ time: '2017-11-06', value: 174.67 },
	{ time: '2017-11-13', value: 170.15 },
	{ time: '2017-11-20', value: 174.97 },
	{ time: '2017-11-27', value: 171.05 },
	{ time: '2017-12-04', value: 169.37 },
	{ time: '2017-12-11', value: 173.97 },
	{ time: '2017-12-18', value: 175.01 },
	{ time: '2017-12-25', value: 169.23 },
	{ time: '2018-01-01', value: 175.0 },
	{ time: '2018-01-08', value: 177.09 },
	{ time: '2018-01-15', value: 178.46 },
	{ time: '2018-01-22', value: 171.51 },
	{ time: '2018-01-29', value: 160.5 },
	{ time: '2018-02-05', value: 156.41 },
	{ time: '2018-02-12', value: 172.43 },
	{ time: '2018-02-19', value: 175.5 },
	{ time: '2018-02-26', value: 176.21 },
	{ time: '2018-03-05', value: 179.98 },
	{ time: '2018-03-12', value: 178.02 },
	{ time: '2018-03-19', value: 164.94 },
	{ time: '2018-03-26', value: 167.78 },
	{ time: '2018-04-02', value: 168.38 },
	{ time: '2018-04-09', value: 174.73 },
	{ time: '2018-04-16', value: 165.72 },
	{ time: '2018-04-23', value: 162.32 },
	{ time: '2018-04-30', value: 183.83 },
	{ time: '2018-05-07', value: 188.59 },
	{ time: '2018-05-14', value: 186.31 },
	{ time: '2018-05-21', value: 188.58 },
	{ time: '2018-05-28', value: 190.24 },
	{ time: '2018-06-04', value: 191.7 },
	{ time: '2018-06-11', value: 188.84 },
	{ time: '2018-06-18', value: 184.92 },
	{ time: '2018-06-25', value: 185.11 },
	{ time: '2018-07-02', value: 187.97 },
	{ time: '2018-07-09', value: 191.33 },
	{ time: '2018-07-16', value: 191.44 },
	{ time: '2018-07-23', value: 190.98 },
	{ time: '2018-07-30', value: 207.99 },
	{ time: '2018-08-06', value: 207.53 },
	{ time: '2018-08-13', value: 217.58 },
	{ time: '2018-08-20', value: 216.16 },
	{ time: '2018-08-27', value: 227.63 },
	{ time: '2018-09-03', value: 221.3 },
	{ time: '2018-09-10', value: 223.84 },
	{ time: '2018-09-17', value: 217.66 },
	{ time: '2018-09-24', value: 225.74 },
	{ time: '2018-10-01', value: 224.29 },
	{ time: '2018-10-08', value: 222.11 },
	{ time: '2018-10-15', value: 219.31 },
	{ time: '2018-10-22', value: 216.3 },
	{ time: '2018-10-29', value: 207.48 },
	{ time: '2018-11-05', value: 204.47 },
	{ time: '2018-11-12', value: 193.53 },
	{ time: '2018-11-19', value: 172.29 },
	{ time: '2018-11-26', value: 178.58 },
	{ time: '2018-12-03', value: 168.49 },
	{ time: '2018-12-10', value: 165.48 },
	{ time: '2018-12-17', value: 150.73 },
	{ time: '2018-12-24', value: 156.23 },
	{ time: '2018-12-31', value: 148.26 },
	{ time: '2019-01-07', value: 152.29 },
	{ time: '2019-01-14', value: 156.82 },
	{ time: '2019-01-21', value: 157.76 },
	{ time: '2019-01-28', value: 166.52 },
	{ time: '2019-02-04', value: 170.41 },
	{ time: '2019-02-11', value: 170.42 },
	{ time: '2019-02-18', value: 172.97 },
	{ time: '2019-02-25', value: 174.97 },
	{ time: '2019-03-04', value: 172.91 },
	{ time: '2019-03-11', value: 186.12 },
	{ time: '2019-03-18', value: 191.05 },
	{ time: '2019-03-25', value: 189.95 },
	{ time: '2019-04-01', value: 197.0 },
	{ time: '2019-04-08', value: 198.87 },
	{ time: '2019-04-15', value: 203.86 },
	{ time: '2019-04-22', value: 204.3 },
	{ time: '2019-04-29', value: 211.75 },
	{ time: '2019-05-06', value: 197.18 },
	{ time: '2019-05-13', value: 189.0 },
	{ time: '2019-05-20', value: 178.97 },
	{ time: '2019-05-27', value: 179.03 },
]);

const container = document.getElementById('container');

const toolTipWidth = 80;
const toolTipHeight = 80;
const toolTipMargin = 15;

// Create and style the tooltip html element
const toolTip = document.createElement('div');
toolTip.style = `width: 96px; height: 80px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border: 1px solid; border-radius: 2px;font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
toolTip.style.background = 'white';
toolTip.style.color = 'black';
toolTip.style.borderColor = 'rgba( 38, 166, 154, 1)';
container.appendChild(toolTip);

// update tooltip
chart.subscribeCrosshairMove(param => {
	if (
		param.point === undefined ||
		!param.time ||
		param.point.x < 0 ||
		param.point.x > container.clientWidth ||
		param.point.y < 0 ||
		param.point.y > container.clientHeight
	) {
		toolTip.style.display = 'none';
	} else {
		// time will be in the same format that we supplied to setData.
		// thus it will be YYYY-MM-DD
		const dateStr = param.time;
		toolTip.style.display = 'block';
		const data = param.seriesData.get(series);
		const price = data.value !== undefined ? data.value : data.close;
		toolTip.innerHTML = `<div style="color: ${'rgba( 38, 166, 154, 1)'}">ABC Inc.</div><div style="font-size: 24px; margin: 4px 0px; color: ${'black'}">
			${Math.round(100 * price) / 100}
			</div><div style="color: ${'black'}">
			${dateStr}
			</div>`;

		const y = param.point.y;
		let left = param.point.x + toolTipMargin;
		if (left > container.clientWidth - toolTipWidth) {
			left = param.point.x - toolTipMargin - toolTipWidth;
		}

		let top = y + toolTipMargin;
		if (top > container.clientHeight - toolTipHeight) {
			top = y - toolTipHeight - toolTipMargin;
		}
		toolTip.style.left = left + 'px';
		toolTip.style.top = top + 'px';
	}
});

chart.timeScale().fitContent();
```

### Magnifier Tooltip

The magnifier tooltip will position itself along the top edge of the chart while following
the user's cursor along the horizontal time axis.

```js
const chartOptions = {
	layout: {
		textColor: 'black',
		background: { type: 'solid', color: 'white' },
	},
};
const chart = createChart(document.getElementById('container'), chartOptions);

chart.applyOptions({
	leftPriceScale: {
		visible: true,
		borderVisible: false,
	},
	rightPriceScale: {
		visible: false,
	},
	timeScale: {
		borderVisible: false,
	},
	crosshair: {
		horzLine: {
			visible: false,
			labelVisible: false,
		},
		vertLine: {
			visible: true,
			style: 0,
			width: 2,
			color: 'rgba(32, 38, 46, 0.1)',
			labelVisible: false,
		},
	},
	// hide the grid lines
	grid: {
		vertLines: {
			visible: false,
		},
		horzLines: {
			visible: false,
		},
	},
});

const series = chart.addSeries(AreaSeries, {
	topColor: 'rgba( 239, 83, 80, 0.05)',
	bottomColor: 'rgba( 239, 83, 80, 0.28)',
	lineColor: 'rgba( 239, 83, 80, 1)',
	lineWidth: 2,
	crossHairMarkerVisible: false,
	priceLineVisible: false,
	lastValueVisible: false,
});
series.priceScale().applyOptions({
	scaleMargins: {
		top: 0.3, // leave some space for the legend
		bottom: 0.25,
	},
});

series.setData([
	{ time: '2018-03-28', value: 154 },
	{ time: '2018-03-29', value: 154.2 },
	{ time: '2018-03-30', value: 155.60001 },
	{ time: '2018-04-02', value: 156.25 },
	{ time: '2018-04-03', value: 156.25 },
	{ time: '2018-04-04', value: 156.05 },
	{ time: '2018-04-05', value: 158.05 },
	{ time: '2018-04-06', value: 157.3 },
	{ time: '2018-04-09', value: 144 },
	{ time: '2018-04-10', value: 144.8 },
	{ time: '2018-04-11', value: 143.5 },
	{ time: '2018-04-12', value: 147.05 },
	{ time: '2018-04-13', value: 144.85001 },
	{ time: '2018-04-16', value: 145.39999 },
	{ time: '2018-04-17', value: 147.3 },
	{ time: '2018-04-18', value: 153.55 },
	{ time: '2018-04-19', value: 150.95 },
	{ time: '2018-04-20', value: 149.39999 },
	{ time: '2018-04-23', value: 148.5 },
	{ time: '2018-04-24', value: 146.60001 },
	{ time: '2018-04-25', value: 144.45 },
	{ time: '2018-04-26', value: 145.60001 },
	{ time: '2018-04-27', value: 144.3 },
	{ time: '2018-04-30', value: 144 },
	{ time: '2018-05-02', value: 147.3 },
	{ time: '2018-05-03', value: 144.2 },
	{ time: '2018-05-04', value: 141.64999 },
	{ time: '2018-05-07', value: 141.89999 },
	{ time: '2018-05-08', value: 140.39999 },
	{ time: '2018-05-10', value: 139.8 },
	{ time: '2018-05-11', value: 137.5 },
	{ time: '2018-05-14', value: 136.14999 },
	{ time: '2018-05-15', value: 138 },
	{ time: '2018-05-16', value: 137.95 },
	{ time: '2018-05-17', value: 137.95 },
	{ time: '2018-05-18', value: 136.75 },
	{ time: '2018-05-21', value: 136.2 },
	{ time: '2018-05-22', value: 135 },
	{ time: '2018-05-23', value: 132.55 },
	{ time: '2018-05-24', value: 132.7 },
	{ time: '2018-05-25', value: 132.2 },
	{ time: '2018-05-28', value: 131.55 },
	{ time: '2018-05-29', value: 131.85001 },
	{ time: '2018-05-30', value: 139.85001 },
	{ time: '2018-05-31', value: 140.8 },
	{ time: '2018-06-01', value: 139.64999 },
	{ time: '2018-06-04', value: 137.10001 },
	{ time: '2018-06-05', value: 139.25 },
	{ time: '2018-06-06', value: 141.3 },
	{ time: '2018-06-07', value: 145 },
	{ time: '2018-06-08', value: 143.89999 },
	{ time: '2018-06-11', value: 142.7 },
	{ time: '2018-06-13', value: 144.05 },
	{ time: '2018-06-14', value: 143.55 },
	{ time: '2018-06-15', value: 140.5 },
	{ time: '2018-06-18', value: 139.64999 },
	{ time: '2018-06-19', value: 138 },
	{ time: '2018-06-20', value: 141 },
	{ time: '2018-06-21', value: 140.55 },
	{ time: '2018-06-22', value: 140.55 },
	{ time: '2018-06-25', value: 140.75 },
	{ time: '2018-06-26', value: 140.64999 },
	{ time: '2018-06-27', value: 141.14999 },
	{ time: '2018-06-28', value: 139.8 },
	{ time: '2018-06-29', value: 139.8 },
	{ time: '2018-07-02', value: 140.14999 },
	{ time: '2018-07-03', value: 143.05 },
	{ time: '2018-07-04', value: 140 },
	{ time: '2018-07-05', value: 129.2 },
	{ time: '2018-07-06', value: 129.55 },
	{ time: '2018-07-09', value: 128.3 },
	{ time: '2018-07-10', value: 126.55 },
	{ time: '2018-07-11', value: 124.3 },
	{ time: '2018-07-12', value: 124.8 },
	{ time: '2018-07-13', value: 123.25 },
	{ time: '2018-07-16', value: 123 },
	{ time: '2018-07-17', value: 124.25 },
	{ time: '2018-07-18', value: 123 },
	{ time: '2018-07-19', value: 121 },
	{ time: '2018-07-20', value: 121.45 },
	{ time: '2018-07-23', value: 123.8 },
	{ time: '2018-07-24', value: 122.15 },
	{ time: '2018-07-25', value: 121.3 },
	{ time: '2018-07-26', value: 122.7 },
	{ time: '2018-07-27', value: 122.2 },
	{ time: '2018-07-30', value: 121.7 },
	{ time: '2018-07-31', value: 122.95 },
	{ time: '2018-08-01', value: 121 },
	{ time: '2018-08-02', value: 116 },
	{ time: '2018-08-03', value: 118.1 },
	{ time: '2018-08-06', value: 114.3 },
	{ time: '2018-08-07', value: 114.25 },
	{ time: '2018-08-08', value: 111.85 },
	{ time: '2018-08-09', value: 109.7 },
	{ time: '2018-08-10', value: 105 },
	{ time: '2018-08-13', value: 105.75 },
	{ time: '2018-08-14', value: 107.25 },
	{ time: '2018-08-15', value: 107.4 },
	{ time: '2018-08-16', value: 110.5 },
	{ time: '2018-08-17', value: 109 },
	{ time: '2018-08-20', value: 108.95 },
	{ time: '2018-08-21', value: 108.35 },
	{ time: '2018-08-22', value: 108.6 },
	{ time: '2018-08-23', value: 105.65 },
	{ time: '2018-08-24', value: 104.45 },
	{ time: '2018-08-27', value: 106.2 },
	{ time: '2018-08-28', value: 106.55 },
	{ time: '2018-08-29', value: 111.8 },
	{ time: '2018-08-30', value: 115.5 },
	{ time: '2018-08-31', value: 115.5 },
	{ time: '2018-09-03', value: 114.55 },
	{ time: '2018-09-04', value: 112.75 },
	{ time: '2018-09-05', value: 111.5 },
	{ time: '2018-09-06', value: 108.1 },
	{ time: '2018-09-07', value: 108.55 },
	{ time: '2018-09-10', value: 106.5 },
	{ time: '2018-09-11', value: 105.1 },
	{ time: '2018-09-12', value: 107.2 },
	{ time: '2018-09-13', value: 107.1 },
	{ time: '2018-09-14', value: 105.75 },
	{ time: '2018-09-17', value: 106.05 },
	{ time: '2018-09-18', value: 109.15 },
	{ time: '2018-09-19', value: 111.4 },
	{ time: '2018-09-20', value: 111 },
	{ time: '2018-09-21', value: 111 },
	{ time: '2018-09-24', value: 108.95 },
	{ time: '2018-09-25', value: 106.65 },
	{ time: '2018-09-26', value: 106.7 },
	{ time: '2018-09-27', value: 107.05 },
	{ time: '2018-09-28', value: 106.55 },
	{ time: '2018-10-01', value: 106.2 },
	{ time: '2018-10-02', value: 106.4 },
	{ time: '2018-10-03', value: 107.1 },
	{ time: '2018-10-04', value: 106.4 },
	{ time: '2018-10-05', value: 104.65 },
	{ time: '2018-10-08', value: 102.65 },
	{ time: '2018-10-09', value: 102.1 },
	{ time: '2018-10-10', value: 102.15 },
	{ time: '2018-10-11', value: 100.9 },
	{ time: '2018-10-12', value: 102 },
	{ time: '2018-10-15', value: 100.15 },
	{ time: '2018-10-16', value: 99 },
	{ time: '2018-10-17', value: 98 },
	{ time: '2018-10-18', value: 96 },
	{ time: '2018-10-19', value: 95.5 },
	{ time: '2018-10-22', value: 92.400002 },
	{ time: '2018-10-23', value: 92.300003 },
	{ time: '2018-10-24', value: 92.900002 },
	{ time: '2018-10-25', value: 91.849998 },
	{ time: '2018-10-26', value: 91.599998 },
	{ time: '2018-10-29', value: 94.050003 },
	{ time: '2018-10-30', value: 98.25 },
	{ time: '2018-10-31', value: 97.25 },
	{ time: '2018-11-01', value: 96.879997 },
	{ time: '2018-11-02', value: 101.78 },
	{ time: '2018-11-06', value: 102.4 },
	{ time: '2018-11-07', value: 100.6 },
	{ time: '2018-11-08', value: 98.5 },
	{ time: '2018-11-09', value: 95.139999 },
	{ time: '2018-11-12', value: 96.900002 },
	{ time: '2018-11-13', value: 97.400002 },
	{ time: '2018-11-14', value: 103.3 },
	{ time: '2018-11-15', value: 102.74 },
	{ time: '2018-11-16', value: 101.2 },
	{ time: '2018-11-19', value: 98.720001 },
	{ time: '2018-11-20', value: 102.2 },
	{ time: '2018-11-21', value: 108.8 },
	{ time: '2018-11-22', value: 109.9 },
	{ time: '2018-11-23', value: 113.74 },
	{ time: '2018-11-26', value: 110.9 },
	{ time: '2018-11-27', value: 113.28 },
	{ time: '2018-11-28', value: 113.6 },
	{ time: '2018-11-29', value: 113.14 },
	{ time: '2018-11-30', value: 114.4 },
	{ time: '2018-12-03', value: 111.84 },
	{ time: '2018-12-04', value: 106.7 },
	{ time: '2018-12-05', value: 107.8 },
	{ time: '2018-12-06', value: 106.44 },
	{ time: '2018-12-07', value: 103.7 },
	{ time: '2018-12-10', value: 101.02 },
	{ time: '2018-12-11', value: 102.72 },
	{ time: '2018-12-12', value: 101.8 },
	{ time: '2018-12-13', value: 102 },
	{ time: '2018-12-14', value: 102.1 },
	{ time: '2018-12-17', value: 101.04 },
	{ time: '2018-12-18', value: 101.6 },
	{ time: '2018-12-19', value: 102 },
	{ time: '2018-12-20', value: 102.02 },
	{ time: '2018-12-21', value: 102.2 },
	{ time: '2018-12-24', value: 102.1 },
	{ time: '2018-12-25', value: 100.8 },
	{ time: '2018-12-26', value: 101.02 },
	{ time: '2018-12-27', value: 100.5 },
	{ time: '2018-12-28', value: 101 },
	{ time: '2019-01-03', value: 101.5 },
	{ time: '2019-01-04', value: 101.1 },
	{ time: '2019-01-08', value: 101.1 },
	{ time: '2019-01-09', value: 102.06 },
	{ time: '2019-01-10', value: 105.14 },
	{ time: '2019-01-11', value: 104.66 },
	{ time: '2019-01-14', value: 106.22 },
	{ time: '2019-01-15', value: 106.98 },
	{ time: '2019-01-16', value: 108.4 },
	{ time: '2019-01-17', value: 109.06 },
	{ time: '2019-01-18', value: 107 },
	{ time: '2019-01-21', value: 105.8 },
	{ time: '2019-01-22', value: 105.24 },
	{ time: '2019-01-23', value: 105.4 },
	{ time: '2019-01-24', value: 105.38 },
	{ time: '2019-01-25', value: 105.7 },
	{ time: '2019-01-28', value: 105.8 },
	{ time: '2019-01-29', value: 106.1 },
	{ time: '2019-01-30', value: 108.6 },
	{ time: '2019-01-31', value: 107.92 },
	{ time: '2019-02-01', value: 105.22 },
	{ time: '2019-02-04', value: 102.44 },
	{ time: '2019-02-05', value: 102.26 },
	{ time: '2019-02-06', value: 102 },
	{ time: '2019-02-07', value: 101.62 },
	{ time: '2019-02-08', value: 101.9 },
	{ time: '2019-02-11', value: 101.78 },
	{ time: '2019-02-12', value: 102.7 },
	{ time: '2019-02-13', value: 100.14 },
	{ time: '2019-02-14', value: 101.36 },
	{ time: '2019-02-15', value: 101.62 },
	{ time: '2019-02-18', value: 100.74 },
	{ time: '2019-02-19', value: 100 },
	{ time: '2019-02-20', value: 100.04 },
	{ time: '2019-02-21', value: 100 },
	{ time: '2019-02-22', value: 100.12 },
	{ time: '2019-02-25', value: 100.04 },
	{ time: '2019-02-26', value: 98.980003 },
	{ time: '2019-02-27', value: 97.699997 },
	{ time: '2019-02-28', value: 97.099998 },
	{ time: '2019-03-01', value: 96.760002 },
	{ time: '2019-03-04', value: 98.360001 },
	{ time: '2019-03-05', value: 96.260002 },
	{ time: '2019-03-06', value: 98.120003 },
	{ time: '2019-03-07', value: 99.68 },
	{ time: '2019-03-11', value: 102.1 },
	{ time: '2019-03-12', value: 100.22 },
	{ time: '2019-03-13', value: 100.5 },
	{ time: '2019-03-14', value: 99.660004 },
	{ time: '2019-03-15', value: 100.08 },
	{ time: '2019-03-18', value: 99.919998 },
	{ time: '2019-03-19', value: 99.459999 },
	{ time: '2019-03-20', value: 98.220001 },
	{ time: '2019-03-21', value: 97.300003 },
	{ time: '2019-03-22', value: 97.660004 },
	{ time: '2019-03-25', value: 97 },
	{ time: '2019-03-26', value: 97.019997 },
	{ time: '2019-03-27', value: 96.099998 },
	{ time: '2019-03-28', value: 96.699997 },
	{ time: '2019-03-29', value: 96.300003 },
	{ time: '2019-04-01', value: 97.779999 },
	{ time: '2019-04-02', value: 98.360001 },
	{ time: '2019-04-03', value: 98.5 },
	{ time: '2019-04-04', value: 98.360001 },
	{ time: '2019-04-05', value: 99.540001 },
	{ time: '2019-04-08', value: 98.580002 },
	{ time: '2019-04-09', value: 97.239998 },
	{ time: '2019-04-10', value: 97.32 },
	{ time: '2019-04-11', value: 98.400002 },
	{ time: '2019-04-12', value: 98.220001 },
	{ time: '2019-04-15', value: 98.720001 },
	{ time: '2019-04-16', value: 99.120003 },
	{ time: '2019-04-17', value: 98.620003 },
	{ time: '2019-04-18', value: 98 },
	{ time: '2019-04-19', value: 97.599998 },
	{ time: '2019-04-22', value: 97.599998 },
	{ time: '2019-04-23', value: 96.800003 },
	{ time: '2019-04-24', value: 96.32 },
	{ time: '2019-04-25', value: 96.339996 },
	{ time: '2019-04-26', value: 97.120003 },
	{ time: '2019-04-29', value: 96.980003 },
	{ time: '2019-04-30', value: 96.32 },
	{ time: '2019-05-02', value: 96.860001 },
	{ time: '2019-05-03', value: 96.699997 },
	{ time: '2019-05-06', value: 94.940002 },
	{ time: '2019-05-07', value: 94.5 },
	{ time: '2019-05-08', value: 94.239998 },
	{ time: '2019-05-10', value: 92.900002 },
	{ time: '2019-05-13', value: 91.279999 },
	{ time: '2019-05-14', value: 91.599998 },
	{ time: '2019-05-15', value: 90.080002 },
	{ time: '2019-05-16', value: 91.68 },
	{ time: '2019-05-17', value: 91.959999 },
	{ time: '2019-05-20', value: 91.080002 },
	{ time: '2019-05-21', value: 90.760002 },
	{ time: '2019-05-22', value: 91 },
	{ time: '2019-05-23', value: 90.739998 },
	{ time: '2019-05-24', value: 91 },
	{ time: '2019-05-27', value: 91.199997 },
	{ time: '2019-05-28', value: 90.68 },
	{ time: '2019-05-29', value: 91.120003 },
	{ time: '2019-05-30', value: 90.419998 },
	{ time: '2019-05-31', value: 93.800003 },
	{ time: '2019-06-03', value: 96.800003 },
	{ time: '2019-06-04', value: 96.34 },
	{ time: '2019-06-05', value: 95.94 },
]);

const container = document.getElementById('container');

const toolTipWidth = 96;

// Create and style the tooltip html element
const toolTip = document.createElement('div');
toolTip.style = `width: ${toolTipWidth}px; height: 300px; position: absolute; display: none; padding: 8px; box-sizing: border-box; font-size: 12px; text-align: left; z-index: 1000; top: 12px; left: 12px; pointer-events: none; border-radius: 4px 4px 0px 0px; border-bottom: none; box-shadow: 0 2px 5px 0 rgba(117, 134, 150, 0.45);font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;`;
toolTip.style.background = `rgba(${'255, 255, 255'}, 0.25)`;
toolTip.style.color = 'black';
toolTip.style.borderColor = 'rgba( 239, 83, 80, 1)';
container.appendChild(toolTip);

// update tooltip
chart.subscribeCrosshairMove(param => {
	if (
		param.point === undefined ||
		!param.time ||
		param.point.x < 0 ||
		param.point.x > container.clientWidth ||
		param.point.y < 0 ||
		param.point.y > container.clientHeight
	) {
		toolTip.style.display = 'none';
	} else {
		// time will be in the same format that we supplied to setData.
		// thus it will be YYYY-MM-DD
		const dateStr = param.time;
		toolTip.style.display = 'block';
		const data = param.seriesData.get(series);
		const price = data.value !== undefined ? data.value : data.close;
		toolTip.innerHTML = `<div style="color: ${'rgba( 239, 83, 80, 1)'}">⬤ ABC Inc.</div><div style="font-size: 24px; margin: 4px 0px; color: ${'black'}">
			${Math.round(100 * price) / 100}
			</div><div style="color: ${'black'}">
			${dateStr}
			</div>`;

		let left = param.point.x; // relative to timeScale
		const timeScaleWidth = chart.timeScale().width();
		const priceScaleWidth = chart.priceScale('left').width();
		const halfTooltipWidth = toolTipWidth / 2;
		left += priceScaleWidth - halfTooltipWidth;
		left = Math.min(left, priceScaleWidth + timeScaleWidth - toolTipWidth);
		left = Math.max(left, priceScaleWidth);

		toolTip.style.left = left + 'px';
		toolTip.style.top = 0 + 'px';
	}
});

chart.timeScale().fitContent();
```

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
