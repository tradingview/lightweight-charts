# Screenshot

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
// The chart takes the space above the button, which is added further down.
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

function saveScreenshot() {
	// A canvas with the chart drawn on it, scales included.
	const canvas = chart.takeScreenshot();
	canvas.toBlob(blob => {
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'chart.png';
		link.click();
		// Released a second later: some browsers still read the file after `click` returns.
		setTimeout(() => URL.revokeObjectURL(link.href), 1000);
	}, 'image/png');
}

const styles = `
    .buttons-container {
        display: flex;
        flex-direction: row;
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
const button = document.createElement('button');
button.innerText = 'Save as PNG';
button.addEventListener('click', saveScreenshot);
buttonsContainer.appendChild(button);

container.appendChild(buttonsContainer);

// Sample data: daily bars, a seeded random walk, so the chart looks the same
// on every load.
function generateBars(count = 100) {
	let seed = 31;
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

The chart can draw itself on a new canvas, which the page can then save as an image.

1. [`takeScreenshot`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#takescreenshot) returns a canvas with the chart on it, including the price and time scales.
2. [`toBlob`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) turns the canvas into a PNG file.
3. A temporary link with the `download` attribute saves the file as `chart.png`.

These lines are highlighted in the code.

## Tips

- By default, the screenshot leaves out the chart's top layer, where the crosshair and some plugin drawings are drawn. `takeScreenshot(true)` adds the top layer without the crosshair, and `takeScreenshot(true, true)` adds the crosshair as well.
- To show the image on the page instead of saving it, set an `img` element's `src` to `canvas.toDataURL()`.
- Elements you add over the chart, such as a legend or a tooltip, are HTML, not part of the chart canvas, so they are not in the screenshot.

## Resources

- [`IChartApi.takeScreenshot`](https://tradingview.github.io/lightweight-charts/docs/api/interfaces/IChartApi#takescreenshot)
- Related examples: [Legend](https://tradingview.github.io/lightweight-charts/examples/tooltips-and-legends/legend.md), [Text watermark](https://tradingview.github.io/lightweight-charts/examples/styling/text-watermark.md)

---

## Sitemap

- [All documentation pages](https://tradingview.github.io/lightweight-charts/llms.txt)
- [Full page map with headings](https://tradingview.github.io/lightweight-charts/docs_map.md)
