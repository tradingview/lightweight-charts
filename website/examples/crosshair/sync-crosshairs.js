// remove-start
// Lightweight Charts™ Example: Sync crosshairs between two charts
// https://tradingview.github.io/lightweight-charts/examples/crosshair/sync-crosshairs
// remove-end

// hide-start
function generateData(startValue, startDate) {
	const res = [];
	const time = startDate ?? (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: startValue + i / 5 + 10 * Math.sin(i / 8 + startValue),
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

// The two charts share the container, one above the other, each in its own
// element. `autoSize` keeps each chart the size of its element.
const container = document.getElementById('container');
container.style.display = 'flex';
container.style.flexDirection = 'column';
const createChartElement = () => {
	const element = document.createElement('div');
	element.style.flex = '1';
	element.style.minHeight = '0';
	container.appendChild(element);
	return element;
};

const chart1 = createChart(
	createChartElement(),
	{
		autoSize: true,
		crosshair: {
			mode: 0,
		},
		timeScale: {
			visible: false,
		},
		layout: {
			textColor: CHART_TEXT_COLOR,
			background: { type: 'solid', color: CHART_RED_TINT_BACKGROUND_COLOR },
		},
		grid: {
			vertLines: { color: CHART_GRID_COLOR },
			horzLines: { color: CHART_GRID_COLOR },
		},
	}
);
const mainSeries1 = chart1.addSeries(LineSeries, {
	color: LINE_LINE2_COLOR,
});

mainSeries1.setData(generateData(0));

const chart2 = createChart(
	createChartElement(),
	{
		autoSize: true,
		layout: {
			textColor: CHART_TEXT_COLOR,
			background: { type: 'solid', color: CHART_BLUE_TINT_BACKGROUND_COLOR },
		},
		grid: {
			vertLines: { color: CHART_GRID_COLOR },
			horzLines: { color: CHART_GRID_COLOR },
		},
	}
);

const mainSeries2 = chart2.addSeries(LineSeries, {
	color: LINE_LINE_COLOR,
});

mainSeries2.setData(generateData(100));
// hide-end

chart1.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
	chart2.timeScale().setVisibleLogicalRange(timeRange);
});

chart2.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
	chart1.timeScale().setVisibleLogicalRange(timeRange);
});

function getCrosshairDataPoint(series, param) {
	if (!param.time) {
		return null;
	}
	const dataPoint = param.seriesData.get(series);
	return dataPoint || null;
}

function syncCrosshair(chart, series, dataPoint) {
	if (dataPoint) {
		chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
		return;
	}
	chart.clearCrosshairPosition();
}
chart1.subscribeCrosshairMove(param => {
	const dataPoint = getCrosshairDataPoint(mainSeries1, param);
	syncCrosshair(chart2, mainSeries2, dataPoint);
});
chart2.subscribeCrosshairMove(param => {
	const dataPoint = getCrosshairDataPoint(mainSeries2, param);
	syncCrosshair(chart1, mainSeries1, dataPoint);
});
