// Data from https://github.com/tradingview/lightweight-charts/issues/1680

function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));

	const plateauSeries = chart.addSeries(LightweightCharts.LineSeries, {
		lineType: LightweightCharts.LineType.Curved,
	});

	const day = 24 * 60 * 60;
	const firstDay = new Date(2000, 0, 1).getTime() / 1000;

	plateauSeries.setData([
		{ time: firstDay, value: 100 },
		{ time: firstDay + day, value: 100 },
		{ time: firstDay + 2 * day, value: 20 },
	]);

	const spikesSeries = chart.addSeries(LightweightCharts.LineSeries, {
		lineType: LightweightCharts.LineType.Curved,
		color: 'red',
	});

	spikesSeries.setData(
		[3, 3, 3, 1, 1, 3, 1, 1, 3, 1, 1].map((value, index) => ({
			time: firstDay + (index * day) / 4,
			value: value * 20,
		}))
	);

	// A zigzag where every point is a local extreme - should be drawn as smooth waves with
	// level crests and troughs.
	const zigzagSeries = chart.addSeries(LightweightCharts.LineSeries, {
		lineType: LightweightCharts.LineType.Curved,
		color: 'green',
	});

	zigzagSeries.setData(
		[150, 200, 150, 200, 150, 200, 150, 200, 150].map((value, index) => ({
			time: firstDay + (index * day) / 4,
			value,
		}))
	);

	chart.timeScale().fitContent();
}
