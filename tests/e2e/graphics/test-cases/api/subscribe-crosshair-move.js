function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addSeries(LightweightCharts.AreaSeries);
	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-28', value: 3 },
		{ time: '1990-04-29', value: 4 },
		{ time: '1990-04-30', value: 5 },
	]);

	chart.timeScale().fitContent();

	const textWatermark = LightweightCharts.createTextWatermark(chart.panes()[0], {
		lines: [
			{
				text: '',
				color: 'red',
				fontSize: 12,
			},
		],
	});

	chart.subscribeCrosshairMove(param => {
		if (param.time) {
			const seriesData = param.seriesData.get(series) || {};
			textWatermark.applyOptions({
				lines: [
					{
						text: `${param.time} - ${seriesData.time}`,
						color: 'red',
						fontSize: 12,
					},
				],
			});
		}
	});
}
