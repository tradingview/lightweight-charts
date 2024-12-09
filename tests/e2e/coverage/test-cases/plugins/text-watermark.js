function simpleData() {
	return [
		{ time: 1663740000, value: 10 },
		{ time: 1663750000, value: 20 },
		{ time: 1663760000, value: 30 },
	];
}

function interactionsToPerform() {
	return [];
}

let chart;
let textWatermark;

function beforeInteractions(container) {
	chart = LightweightCharts.createChart(container);

	const mainSeries = chart.addSeries(LightweightCharts.LineSeries);

	mainSeries.setData(simpleData());
	const pane = chart.panes()[0];
	textWatermark = LightweightCharts.createTextWatermark(pane, {
		horzAlign: 'center',
		vertAlign: 'center',
		lines: [
			{
				text: 'Hello',
				color: 'rgba(255,0,0,0.5)',
				fontSize: 100,
				fontStyle: 'bold',
			},
			{
				text: 'This is a text watermark',
				color: 'rgba(0,0,255,0.5)',
				fontSize: 50,
				fontStyle: 'italic',
				fontFamily: 'monospace',
			},
		],
	});
	textWatermark.getPane();

	return Promise.resolve();
}

function afterInteractions() {
	textWatermark.applyOptions({
		horzAlign: 'left',
		vertAlign: 'top',
	});

	return new Promise(resolve => {
		requestAnimationFrame(() => {
			textWatermark.applyOptions({
				horzAlign: 'right',
				vertAlign: 'bottom',
			});
			textWatermark.detach();
		});
		requestAnimationFrame(resolve);
	});
}
