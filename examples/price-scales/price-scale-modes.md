# Price scale modes

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

// Two assets at very different price levels, on the same price scale.
const firstSeries = chart.addSeries(LineSeries, { color: '#2962FF' });
firstSeries.setData(generateValues({ start: 20, seed: 11 }));
const secondSeries = chart.addSeries(LineSeries, { color: 'rgb(225, 87, 90)' });
secondSeries.setData(generateValues({ start: 400, seed: 5 }));

chart.timeScale().fitContent();

function setMode(mode) {
	chart.priceScale('right').applyOptions({ mode });
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
const modes = [
	['Normal', PriceScaleMode.Normal],
	['Logarithmic', PriceScaleMode.Logarithmic],
	['Percentage', PriceScaleMode.Percentage],
	['Indexed to 100', PriceScaleMode.IndexedTo100],
];
modes.forEach(([label, mode]) => {
	const button = document.createElement('button');
	button.innerText = label;
	button.addEventListener('click', () => setMode(mode));
	buttonsContainer.appendChild(button);
});

container.appendChild(buttonsContainer);

// Start in percentage mode, where both lines start from 0%.
setMode(PriceScaleMode.Percentage);

// Sample data: a seeded random walk in percent steps, so the chart looks the
// same on every load.
function generateValues({ start, seed, count = 250 }) {
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const day = 24 * 60 * 60;
	let time = Date.UTC(2024, 0, 1) / 1000;
	let value = start;
	const points = [];
	for (let i = 0; i < count; i++) {
		value *= 1 + (random() - 0.47) * 0.04;
		points.push({ time, value });
		time += day;
	}
	return points;
}
```

## How it works

The price scale has four modes. The two assets here trade near 20 and near 400, so on a normal scale the cheaper one is almost flat.

1. The buttons call `setMode`, which passes [`mode`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions#mode) to the price scale's [`applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IPriceScaleApi#applyoptions).
2. [`PriceScaleMode`](https://tradingview.github.io/lightweight-charts/docs/api/enumerations/PriceScaleMode) lists the modes:
   - `Normal` shows prices as they are;
   - `Logarithmic` gives equal percent changes equal height;
   - `Percentage` shows the change from the first visible value, in percent;
   - `IndexedTo100` shows the same change as an index that starts at 100.

The chart starts in percentage mode. The call is highlighted in the code.

## Tips

- Percentage and indexed modes count from the first value in view, so the lines move as you scroll. Use them to compare how assets moved over the same period.
- All series on a price scale share its mode. To show one series in another mode, put it on a [second price scale](https://tradingview.github.io/lightweight-charts/examples/price-scales/two-price-scales.md).

## Resources

- [Price scale](https://tradingview.github.io/lightweight-charts/docs/price-scale.md)
- [`PriceScaleOptions.mode`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/PriceScaleOptions#mode)
- Related examples: [Compare multiple series](https://tradingview.github.io/lightweight-charts/examples/series-types/compare-multiple-series.md), [Two price scales](https://tradingview.github.io/lightweight-charts/examples/price-scales/two-price-scales.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
