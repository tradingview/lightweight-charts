import { createChart, createImageWatermark, createTextWatermark, LineSeries } from '../../src';

const chart = createChart('anything');

const mainSeries = chart.addSeries(LineSeries);
mainSeries.setData([]);

const imageWatermark = createImageWatermark(chart.panes()[0], '/debug/image.svg', {
	alpha: 0.5,
	padding: 50,
	maxHeight: 400,
	maxWidth: 400,
});

imageWatermark.applyOptions({
	alpha: 0.75,
});

const watermarkPlugin = createTextWatermark(chart.panes()[1], {
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

watermarkPlugin.applyOptions({
	horzAlign: 'left',
});
