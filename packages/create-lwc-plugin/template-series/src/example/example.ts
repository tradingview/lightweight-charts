import { createChart } from 'lightweight-charts';
import { _CLASSNAME_ } from '../template-entry';
import { _CLASSNAME_Data } from '../data';
import { generateSampleData } from '../sample-data';

const chart = ((window as unknown as any).chart = createChart('chart', {
	autoSize: true,
}));

const series = chart.addCustomSeries(new _CLASSNAME_(), {
	/* Options */
});

const data: _CLASSNAME_Data[] = generateSampleData(500, 50);
series.setData(data);
