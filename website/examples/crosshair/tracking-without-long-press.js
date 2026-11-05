// remove-start
// Lightweight Charts™ Example: Tracking without long-press
// https://tradingview.github.io/lightweight-charts/examples/crosshair/tracking-without-long-press
// remove-end

// hide-start
function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: 100 + i / 5 + 10 * Math.sin(i / 8),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

const chart = createChart(
	document.getElementById('container'),
	{
		layout: {
			textColor: CHART_TEXT_COLOR,
			background: { type: 'solid', color: CHART_BACKGROUND_COLOR },
		},
		grid: {
			vertLines: { color: CHART_GRID_COLOR },
			horzLines: { color: CHART_GRID_COLOR },
		},
		handleScale: false,
		handleScroll: false,
	}
);

const mainSeries = chart.addSeries(LineSeries, {
	color: LINE_LINE_COLOR,
	priceFormat: {
		minMove: 1,
		precision: 0,
	},
});

mainSeries.setData(generateData());

chart.timeScale().fitContent();
// hide-end

document.getElementById('container').addEventListener('touchmove', e => {
	const bcr = document.getElementById('container').getBoundingClientRect();
	// Touch coordinates are relative to the viewport; the chart's are relative to the container.
	const x = e.touches[0].clientX - bcr.left;
	const y = e.touches[0].clientY - bcr.top;

	const price = mainSeries.coordinateToPrice(y);
	const time = chart.timeScale().coordinateToTime(x);

	if (!Number.isFinite(price) || !Number.isFinite(time)) {
		return;
	}

	chart.setCrosshairPosition(price, time, mainSeries);
});

document.getElementById('container').addEventListener('touchend', () => {
	chart.clearCrosshairPosition();
});
