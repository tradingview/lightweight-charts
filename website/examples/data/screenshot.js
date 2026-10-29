// remove-start
// Lightweight Charts™ Example: Screenshot
// https://tradingview.github.io/lightweight-charts/examples/data/screenshot

// remove-end
// hide-start
const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
	grid: {
		vertLines: { color: CHART_GRID_COLOR },
		horzLines: { color: CHART_GRID_COLOR },
	},
	// Fill the element the chart is created in, whatever its size.
	autoSize: true,
};
// hide-end
const container = document.getElementById('container');
// The chart takes the space above the button, which is added further down.
container.style.display = 'flex';
container.style.flexDirection = 'column';
const chartElement = document.createElement('div');
chartElement.style.flex = '1';
chartElement.style.minHeight = '0';
container.appendChild(chartElement);
// remove-line
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(chartElement, chartOptions);

const series = chart.addSeries(CandlestickSeries, {
	upColor: BAR_UP_COLOR,
	downColor: BAR_DOWN_COLOR,
	borderVisible: false,
	wickUpColor: BAR_UP_COLOR,
	wickDownColor: BAR_DOWN_COLOR,
});
series.setData(generateBars());
chart.timeScale().fitContent();

function saveScreenshot() {
	// highlight-start
	// A canvas with the chart drawn on it, scales included.
	const canvas = chart.takeScreenshot();
	canvas.toBlob(blob => {
		const link = document.createElement('a');
		link.href = URL.createObjectURL(blob);
		link.download = 'chart.png';
		link.click();
		// Released later: some browsers still read the file after `click` returns.
		setTimeout(() => URL.revokeObjectURL(link.href));
	}, 'image/png');
	// highlight-end
}

// hide-start
const styles = `
    .buttons-container {
        display: flex;
        flex-direction: row;
        gap: 8px;
        padding: 8px;
        background-color: ${CHART_BACKGROUND_COLOR};
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
        color: ${BUTTON_TEXT_COLOR};
        background-color: ${BUTTON_COLOR};
        border-radius: 8px;
        cursor: pointer;
    }

    .buttons-container button:hover {
        background-color: ${BUTTON_HOVER_COLOR};
    }

    .buttons-container button:active {
        background-color: ${BUTTON_ACTIVE_COLOR};
    }
`;

const stylesElement = document.createElement('style');
stylesElement.innerHTML = styles;
container.appendChild(stylesElement);

const buttonsContainer = document.createElement('div');
buttonsContainer.classList.add('buttons-container');
// hide-end
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
