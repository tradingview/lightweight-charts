// remove-start
// Lightweight Charts™ Example: Crosshair syncing
// https://tradingview.github.io/lightweight-charts/tutorials/how_to/set-crosshair-position

// hide-start
function generateData(startValue, startDate) {
	const res = [];
	const time = startDate ?? (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0)));
	for (let i = 0; i < 500; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i + startValue,
		});

		time.setUTCDate(time.getUTCDate() + 1);
	}

	return res;
}

const chart1 = createChart(
	document.getElementById('container'),
	{
		height: 250,
		crosshair: {
			mode: 0,
		},
		timeScale: {
			visible: false,
		},
		layout: {
			background: {
				type: 'solid',
				color: '#FFF5F5',
			},
		},
	}
);
const mainSeries1 = chart1.addLineSeries({
	color: 'red',
});

mainSeries1.setData(generateData(0));

const chart2 = createChart(
	document.getElementById('container'),
	{
		height: 250,
		layout: {
			background: {
				type: 'solid',
				color: '#F5F5FF',
			},
		},
	}
);
const mainSeries2 = chart2.addLineSeries({
	color: 'blue',
});

mainSeries2.setData(generateData(100));

chart1.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
	chart2.timeScale().setVisibleLogicalRange(timeRange);
});

chart2.timeScale().subscribeVisibleLogicalRangeChange(timeRange => {
	chart1.timeScale().setVisibleLogicalRange(timeRange);
});
// hide-end

function syncCrosshair(chart, series, param) {
	if (!param.time) {
		chart.clearCrosshairPosition();
		return;
	}
	const dataPoint = param.seriesData.get(series);
	if (dataPoint) {
		chart.setCrosshairPosition(dataPoint.value, dataPoint.time, series);
		return;
	}
	chart.clearCrosshairPosition();
}

chart1.subscribeCrosshairMove(param => {
	syncCrosshair(chart2, mainSeries1, param);
});

chart2.subscribeCrosshairMove(param => {
	syncCrosshair(chart1, mainSeries2, param);
});
