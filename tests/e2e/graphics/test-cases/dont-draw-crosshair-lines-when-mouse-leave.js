/*
	When the mouse leaves the chart pane then the crosshair line should not be drawn
*/

window.ignoreMouseMove = true;

function initialInteractionsToPerform() {
	return [{ action: 'moveMouseCenter', target: 'container' }];
}

function finalInteractionsToPerform() {
	return [{ action: 'moveMouseBottomRight', target: 'container' }];
}

function generateData() {
	const res = [];
	const time = new Date(Date.UTC(2023, 0, 1, 0, 0, 0, 0));

	for (let i = 0; i < 12; ++i) {
		res.push({
			time: time.getTime() / 1000,
			value: i,
		});

		time.setUTCMonth(time.getUTCMonth() + 1);
	}

	return res;
}

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(
		container,
		{
			layout: { attributionLogo: false },
			height: 450,
			width: 450,
			crosshair: {
				vertLine: {
					color: 'red',
					width: 4,
					style: 0,
				},
				horzLine: {
					color: 'red',
					width: 4,
					style: 0,
				},
			},
		}
	);

	const series = chart.addSeries(LightweightCharts.LineSeries);
	series.setData(generateData());
	chart.timeScale().fitContent();
}
