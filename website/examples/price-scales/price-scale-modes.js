// remove-start
// Lightweight Charts™ Example: Price scale modes
// https://tradingview.github.io/lightweight-charts/examples/price-scales/price-scale-modes

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
// The chart takes the space above the buttons, which are added further down.
container.style.display = 'flex';
container.style.flexDirection = 'column';
const chartElement = document.createElement('div');
chartElement.style.flex = '1';
chartElement.style.minHeight = '0';
container.appendChild(chartElement);
// remove-line
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(chartElement, chartOptions);

// Two assets at very different price levels, on the same price scale.
const firstSeries = chart.addSeries(LineSeries, { color: LINE_LINE_COLOR });
firstSeries.setData(generateValues({ start: 20, seed: 11 }));
const secondSeries = chart.addSeries(LineSeries, { color: LINE_LINE2_COLOR });
secondSeries.setData(generateValues({ start: 400, seed: 5 }));

chart.timeScale().fitContent();

function setMode(mode) {
	// highlight-start
	chart.priceScale('right').applyOptions({ mode });
	// highlight-end
}

// hide-start
const styles = `
    .buttons-container {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
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
