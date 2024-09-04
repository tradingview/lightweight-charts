import { createChart, createImageWatermark, createTextWatermark } from '../../src';

const chart = createChart('anything');

const mainSeries = chart.addLineSeries();
mainSeries.setData([]);

createImageWatermark(chart.panes()[0], '/debug/image.svg', {
	alpha: 0.5,
	padding: 50,
	maxHeight: 400,
	maxWidth: 400,
});

createTextWatermark(chart.panes()[1], {
	horzAlign: 'center',
	vertAlign: 'center',
	lines: [
		{
			text: 'Hello',
			color: 'rgba(255,0,0,0.5)',
			fontSize: 100,
			fontStyle: 'bold',
		},
	],
});
