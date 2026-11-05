# Crosshair modes

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

const series = chart.addSeries(CandlestickSeries, {
	upColor: '#26a69a',
	downColor: '#ef5350',
	borderVisible: false,
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
});
series.setData(generateBars());
chart.timeScale().fitContent();

function setMode(mode) {
	chart.applyOptions({ crosshair: { mode } });
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
	['Normal', CrosshairMode.Normal],
	['Magnet', CrosshairMode.Magnet],
	['Magnet OHLC', CrosshairMode.MagnetOHLC],
	['Hidden', CrosshairMode.Hidden],
];
modes.forEach(([label, mode]) => {
	const button = document.createElement('button');
	button.innerText = label;
	button.addEventListener('click', () => setMode(mode));
	buttonsContainer.appendChild(button);
});

container.appendChild(buttonsContainer);

// Start in magnet OHLC mode, which snaps to the nearest of the four prices.
setMode(CrosshairMode.MagnetOHLC);

// Sample data: daily bars, a seeded random walk, so the chart looks the same
// on every load.
function generateBars(count = 60) {
	let seed = 19;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const bars = [];
	let time = Date.UTC(2024, 0, 1) / 1000;
	let close = 100;
	for (let i = 0; i < count; i++) {
		const open = close;
		close = open + (random() - 0.48) * 4;
		const high = Math.max(open, close) + random() * 2;
		const low = Math.min(open, close) - random() * 2;
		bars.push({ time, open, high, low, close });
		time += 24 * 60 * 60;
	}
	return bars;
}
```

## How it works

The crosshair mode decides where the horizontal line of the crosshair goes. Hover the chart after each button to see the difference.

1. The buttons call `setMode`, which passes [`crosshair.mode`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CrosshairOptions#mode) to the chart's [`applyOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#applyoptions).
2. [`CrosshairMode`](https://tradingview.github.io/lightweight-charts/docs/api/enumerations/CrosshairMode) lists the modes:
   - `Normal` follows the cursor freely;
   - `Magnet` snaps to the close price of the bar;
   - `MagnetOHLC` snaps to the open, high, low, or close, whichever is nearest to the cursor;
   - `Hidden` does not draw the crosshair.

The chart starts in `MagnetOHLC` mode. The call is highlighted in the code.

## Tips

- On a line or area series, both magnet modes snap to the value of the point.
- `Hidden` only stops the drawing. [`subscribeCrosshairMove`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#subscribecrosshairmove) still reports the cursor, so a custom tooltip keeps working.
- To style the lines instead, set `crosshair.vertLine` and `crosshair.horzLine`, for example their `color`, `style`, and `labelVisible`.

## Resources

- [`CrosshairOptions`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/CrosshairOptions)
- [`CrosshairMode`](https://tradingview.github.io/lightweight-charts/docs/api/enumerations/CrosshairMode)
- Related examples: [Sync crosshairs](https://tradingview.github.io/lightweight-charts/examples/crosshair/sync-crosshairs.md), [Floating tooltip](https://tradingview.github.io/lightweight-charts/examples/tooltips-and-legends/floating-tooltip.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
