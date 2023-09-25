import { createChart } from 'lightweight-charts';
import { generateLineData } from '../../../sample-data';
import { AnchoredText } from '../anchored-text';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true
}));

const lineSeries = chart.addLineSeries();

lineSeries.setData(generateLineData());

const anchoredText = new AnchoredText({
	vertAlign: 'middle',
	horzAlign: 'middle',
	text: 'Anchored Text',
	lineHeight: 54,
	font: 'italic bold 54px Arial',
	color: 'red',
});
lineSeries.attachPrimitive(anchoredText);

// testing the requestUpdate method
setTimeout(() => {
	anchoredText.applyOptions({
		text: 'New Text',
	});
}, 2000);
