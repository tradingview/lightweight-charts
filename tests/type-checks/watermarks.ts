import { createChart, ImageWatermark, TextWatermark } from '../../src';

const chart = createChart('anything');

const mainSeries = chart.addLineSeries();
mainSeries.setData([]);

const imageWatermark = new ImageWatermark('/debug/image.svg', {
	alpha: 0.5,
	padding: 50,
	maxHeight: 400,
	maxWidth: 400,
});
chart.panes()[0].attachPrimitive(imageWatermark);

const textWatermark = new TextWatermark({
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
chart.panes()[1].attachPrimitive(textWatermark);
