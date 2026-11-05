# Visible range

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
	// Fill the element the chart is created in, whatever its size.
	autoSize: true,
};
const container = document.getElementById('container');
// The chart takes the space above the buttons, which are added further down.
container.style.display = 'flex';
container.style.flexDirection = 'column';
const chartElement = document.createElement('div');
chartElement.style.flex = '1';
chartElement.style.minHeight = '0';
container.appendChild(chartElement);
const chart = createChart(chartElement, chartOptions);

// Keep the first and the last bar at the edges: no scrolling past the data.
chart.timeScale().applyOptions({ fixLeftEdge: true, fixRightEdge: true });

const series = chart.addSeries(AreaSeries, {
	lineColor: '#2962FF',
	topColor: '#2962FF',
	bottomColor: 'rgba(41, 98, 255, 0.28)',
	lineWidth: 2,
});
const data = generateValues();
series.setData(data);

const day = 24 * 60 * 60;
const lastTime = data[data.length - 1].time;

function showLast(days) {
	chart.timeScale().setVisibleRange({ from: lastTime - days * day, to: lastTime });
}

const styles = `
    .buttons-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
        padding: 8px;
        background-color: ${'white'};
    }
    .buttons-container button {
        all: initial;
        font-family: -apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu,
            sans-serif;
        font-size: 16px;
        font-style: normal;
        font-weight: 510;
        line-height: 24px; /* 150% */
        letter-spacing: -0.32px;
        padding: 8px 24px;
        color: ${'rgba(19, 23, 34, 1)'};
        background-color: ${'rgba(240, 243, 250, 1)'};
        border-radius: 8px;
        cursor: pointer;
    }

    .buttons-container button:hover {
        background-color: ${'rgba(224, 227, 235, 1)'};
    }

    .buttons-container button:active {
        background-color: ${'rgba(209, 212, 220, 1)'};
    }
`;

const stylesElement = document.createElement('style');
stylesElement.innerHTML = styles;
container.appendChild(stylesElement);

const buttonsContainer = document.createElement('div');
buttonsContainer.classList.add('buttons-container');
const periods = [
	['1W', () => showLast(7)],
	['1M', () => showLast(30)],
	['3M', () => showLast(91)],
	['1Y', () => showLast(365)],
	['All', () => chart.timeScale().fitContent()],
];
periods.forEach(([label, show]) => {
	const button = document.createElement('button');
	button.innerText = label;
	button.addEventListener('click', show);
	buttonsContainer.appendChild(button);
});

container.appendChild(buttonsContainer);

// Start with the last three months.
showLast(91);

// Sample data: two years of daily values, a seeded random walk, so the chart
// looks the same on every load.
function generateValues(count = 730) {
	let seed = 41;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	let time = Date.UTC(2023, 0, 1) / 1000;
	let value = 100;
	const points = [];
	for (let i = 0; i < count; i++) {
		value *= 1 + (random() - 0.48) * 0.03;
		points.push({ time, value });
		time += 24 * 60 * 60;
	}
	return points;
}
```

## How it works

The chart has two years of data, and the buttons choose which part of it is in view.

1. `showLast` passes a range of timestamps, from a number of days before the last bar to the last bar, to [`setVisibleRange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#setvisiblerange).
2. The All button calls [`fitContent`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#fitcontent), which fits all the data into view.
3. [`fixLeftEdge`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScaleOptions#fixleftedge) and [`fixRightEdge`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/TimeScaleOptions#fixrightedge) stop the user from scrolling past the first and the last bar.

The chart starts with the last three months. These lines are highlighted in the code.

## Tips

- `setVisibleRange` stays within the data: a range that starts before the first bar starts at the first bar. To leave empty space at the edges, turn `fixLeftEdge` and `fixRightEdge` off and use [`setVisibleLogicalRange`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#setvisiblelogicalrange), which counts in bars.
- To jump to a date and keep the current zoom, find its bar with [`timeToIndex`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi#timetoindex). Then pass a logical range of the current width around that bar to `setVisibleLogicalRange`.
- To keep the view on the latest bar as new data arrives, see [Realtime updates](https://tradingview.github.io/lightweight-charts/examples/data/realtime-updates.md).

## Resources

- [Time scale: Visible range](https://tradingview.github.io/lightweight-charts/docs/time-scale.md#visible-range)
- [`ITimeScaleApi`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/ITimeScaleApi)
- Related examples: [Range switcher](https://tradingview.github.io/lightweight-charts/examples/data/range-switcher.md), [Infinite history](https://tradingview.github.io/lightweight-charts/examples/data/infinite-history.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
