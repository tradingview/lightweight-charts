import { createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { createBoxWhiskerSeries, defaultOptions } from '../box-whisker-series';
import { boxWhiskerData } from './sample-data';

// The catalog preview: two sections of box plots with their outliers. The dev
// demo next door keeps a whitespace gap and shows the hovered part.
const chart = createChart('chart', { autoSize: true });

const series = createBoxWhiskerSeries(chart, { priceLineVisible: false });
series.setData(boxWhiskerData([0, 20]));
chart.timeScale().fitContent();

mountControls([
	{
		kind: 'select',
		label: 'Colors',
		options: ['default', 'mono'],
		onChange: value =>
			series.applyOptions(
				value === 'mono'
					? { whiskerColor: '#131722', lowerBoxColor: '#90BFF9', upperBoxColor: '#2962FF', medianColor: '#FFFFFF', outlierColor: '#131722' }
					: { whiskerColor: defaultOptions.whiskerColor, lowerBoxColor: defaultOptions.lowerBoxColor, upperBoxColor: defaultOptions.upperBoxColor, medianColor: defaultOptions.medianColor, outlierColor: defaultOptions.outlierColor }
			),
	},
]);
