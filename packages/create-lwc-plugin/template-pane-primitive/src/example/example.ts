import { LineSeries, createChart } from 'lightweight-charts';
import { generateLineData } from '../sample-data';
import { _CLASSNAME_ } from '../template-entry';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const lineSeries = chart.addSeries(LineSeries, {
	color: '#2962FF',
});
lineSeries.setData(generateLineData());

//* Pane primitives are attached to a pane, not to a series.
const pane = chart.panes()[0];

const primitive = new _CLASSNAME_({
	text: '_PLUGINNAME_',
	corner: 'top-left',
});

pane.attachPrimitive(primitive);

chart.timeScale().fitContent();
