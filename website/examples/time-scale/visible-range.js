// remove-start
// Lightweight Charts™ Example: Visible range
// https://tradingview.github.io/lightweight-charts/examples/time-scale/visible-range

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

// highlight-start
// Keep the first and the last bar at the edges: no scrolling past the data.
chart.timeScale().applyOptions({ fixLeftEdge: true, fixRightEdge: true });
// highlight-end

const series = chart.addSeries(AreaSeries, {
	lineColor: LINE_LINE_COLOR,
	topColor: AREA_TOP_COLOR,
	bottomColor: AREA_BOTTOM_COLOR,
	lineWidth: 2,
});
const data = generateValues();
series.setData(data);

const day = 24 * 60 * 60;
const lastTime = data[data.length - 1].time;

function showLast(days) {
	// highlight-start
	chart.timeScale().setVisibleRange({ from: lastTime - days * day, to: lastTime });
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
const periods = [
	['1W', () => showLast(7)],
	['1M', () => showLast(30)],
	['3M', () => showLast(91)],
	['1Y', () => showLast(365)],
	// highlight-next-line
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
