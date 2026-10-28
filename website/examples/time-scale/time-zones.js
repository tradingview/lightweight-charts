// remove-start
// Lightweight Charts™ Example: Time zones
// https://tradingview.github.io/lightweight-charts/examples/time-scale/time-zones

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
	timeScale: { timeVisible: true, secondsVisible: false },
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

const series = chart.addSeries(CandlestickSeries, {
	upColor: BAR_UP_COLOR,
	downColor: BAR_DOWN_COLOR,
	borderVisible: false,
	wickUpColor: BAR_UP_COLOR,
	wickDownColor: BAR_DOWN_COLOR,
});

// The data keeps its UTC timestamps; each time zone gets a shifted copy.
const utcData = generateBars();

// highlight-start
// Moves a UTC timestamp so that the chart, which shows every time in UTC,
// shows the local time that `format` reads for it instead.
function timeToTz(time, format) {
	const parts = {};
	for (const { type, value } of format.formatToParts(new Date(time * 1000))) {
		parts[type] = Number(value);
	}
	return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) / 1000;
}

function setTimeZone(timeZone) {
	// Created once per time zone: creating a format is slower than using it.
	const format = new Intl.DateTimeFormat('en-US', {
		timeZone,
		hourCycle: 'h23',
		year: 'numeric',
		month: 'numeric',
		day: 'numeric',
		hour: 'numeric',
		minute: 'numeric',
		second: 'numeric',
	});
	series.setData(utcData.map(bar => ({ ...bar, time: timeToTz(bar.time, format) })));
}
// highlight-end

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
const timeZones = ['UTC', 'America/New_York', 'Europe/Berlin', 'Asia/Tokyo'];
timeZones.forEach(timeZone => {
	const button = document.createElement('button');
	button.innerText = timeZone;
	button.addEventListener('click', () => setTimeZone(timeZone));
	buttonsContainer.appendChild(button);
});

container.appendChild(buttonsContainer);

// Start in New York, where the session runs from 9:30 to 16:00.
setTimeZone('America/New_York');
chart.timeScale().fitContent();

// Sample data: 30-minute bars of a US stock session, 14:30 to 21:00 UTC, on
// five weekdays. A seeded random walk, so the chart looks the same on every load.
function generateBars() {
	let seed = 23;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	const bars = [];
	let close = 180;
	for (let day = 8; day <= 12; day++) {
		for (let minutes = 14 * 60 + 30; minutes < 21 * 60; minutes += 30) {
			const open = close;
			close = open + (random() - 0.5) * 2;
			const high = Math.max(open, close) + random();
			const low = Math.min(open, close) - random();
			const time = Date.UTC(2024, 0, day, 0, minutes) / 1000;
			bars.push({ time, open, high, low, close });
		}
	}
	return bars;
}
