function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
	}));
	const series = chart.addAreaSeries();
	series.setData([
		{ time: '1990-04-24', value: 0 },
		{ time: '1990-04-25', value: 1 },
		{ time: '1990-04-26', value: 2 },
		{ time: '1990-04-28', value: 3 },
		{ time: '1990-04-29', value: 4 },
		{ time: '1990-04-30', value: 5 },
	]);

	chart.timeScale().fitContent();

	const textWatermark = new LightweightCharts.TextWatermark({
		lines: [
			{
				text: '',
				color: 'red',
				fontSize: 12,
			},
		],
	});
	const pane = chart.panes()[0];
	pane.attachPrimitive(textWatermark);

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
