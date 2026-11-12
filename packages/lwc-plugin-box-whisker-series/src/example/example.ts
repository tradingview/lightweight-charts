import { CustomSeriesWhitespaceData, Time, createChart } from 'lightweight-charts';
import { createBoxWhiskerSeries, defaultOptions } from '../box-whisker-series';
import { BoxWhiskerData } from '../data';
import { boxWhiskerData } from './sample-data';

const palettes = {
	default: {
		whiskerColor: defaultOptions.whiskerColor,
		lowerBoxColor: defaultOptions.lowerBoxColor,
		upperBoxColor: defaultOptions.upperBoxColor,
		medianColor: defaultOptions.medianColor,
		outlierColor: defaultOptions.outlierColor,
	},
	mono: {
		whiskerColor: '#131722',
		lowerBoxColor: '#90BFF9',
		upperBoxColor: '#2962FF',
		medianColor: '#FFFFFF',
		outlierColor: '#131722',
	},
};

const chart = createChart('chart', {
	autoSize: true,
});

const series = createBoxWhiskerSeries(chart, {
	priceLineVisible: false,
});

// A gap of whitespace between the third and the fourth section, and one point
// whose box is colored on its own, over the series colors.
const data: (BoxWhiskerData | CustomSeriesWhitespaceData<Time>)[] = boxWhiskerData();
data[30] = { time: data[30].time };
data[15] = { ...(data[15] as BoxWhiskerData), lowerBoxColor: '#089981', upperBoxColor: '#22AB94' };
series.setData(data);
chart.timeScale().fitContent();

const colors = document.getElementById('colors') as HTMLSelectElement;
const hovered = document.getElementById('hovered') as HTMLSpanElement;

colors.addEventListener('change', () => series.applyOptions(palettes[colors.value as keyof typeof palettes]));

// The series reports the part under the pointer on Lightweight Charts 5.2 and
// later: 'box-<point>', 'median-<point>', 'whisker-<point>' or
// 'outlier-<point>-<index>', where <point> is the point's position in
// series.data(). The readout shows the values of that part.
chart.subscribeCrosshairMove(param => {
	const info = param.hoveredInfo;
	const id = info !== undefined && info.series === series ? info.objectId : undefined;
	if (typeof id !== 'string') {
		hovered.textContent = '';
		return;
	}
	const [part, point, outlier] = id.split('-');
	const data = series.data()[Number(point)] as Partial<BoxWhiskerData> | undefined;
	if (data === undefined) {
		hovered.textContent = '';
		return;
	}
	hovered.textContent = part === 'box'
		? `Box: ${data.q1} to ${data.q3}`
		: part === 'median'
			? `Median: ${data.median}`
			: part === 'whisker'
				? `Whiskers: ${data.min} to ${data.max}`
				: `Outlier: ${data.outliers?.[Number(outlier)]}`;
});
