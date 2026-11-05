// remove-start
// Lightweight Charts™ Example: Custom date format
// https://tradingview.github.io/lightweight-charts/examples/time-scale/custom-date-format

// remove-end
// The chart works in UTC, so the formats read the timestamps in UTC too.
const weekday = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'short' });
const monthName = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', month: 'short' });
const hoursAndMinutes = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fullDate = new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', dateStyle: 'medium', timeStyle: 'short', hourCycle: 'h23' });

const chartOptions = {
	layout: {
		textColor: CHART_TEXT_COLOR,
		background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
	},
	grid: {
		vertLines: { color: CHART_GRID_COLOR },
		horzLines: { color: CHART_GRID_COLOR },
	},
	timeScale: {
		timeVisible: true,
		// highlight-start
		// The labels under the chart: a different format for each kind of mark.
		tickMarkFormatter: (time, tickMarkType) => {
			const date = new Date(time * 1000);
			switch (tickMarkType) {
				case TickMarkType.Year:
					return String(date.getUTCFullYear());
				case TickMarkType.Month:
					return monthName.format(date);
				case TickMarkType.DayOfMonth:
					return `${weekday.format(date)} ${date.getUTCDate()}`;
				default:
					return hoursAndMinutes.format(date);
			}
		},
		// highlight-end
	},
	localization: {
		// highlight-start
		// The label of the crosshair on the time scale.
		timeFormatter: time => fullDate.format(new Date(time * 1000)),
		// highlight-end
	},
};
// remove-line
/** @type {import('lightweight-charts').IChartApi} */
const chart = createChart(document.getElementById('container'), chartOptions);

const series = chart.addSeries(LineSeries, { color: LINE_LINE_COLOR, lineWidth: 2 });
series.setData(generateValues());

chart.timeScale().fitContent();

// Sample data: hourly values over ten days, a seeded random walk, so the chart
// looks the same on every load.
function generateValues(count = 240) {
	let seed = 7;
	const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
	let time = Date.UTC(2024, 0, 26) / 1000;
	let value = 100;
	const points = [];
	for (let i = 0; i < count; i++) {
		value += (random() - 0.5) * 1.5;
		points.push({ time, value });
		time += 60 * 60;
	}
	return points;
}
