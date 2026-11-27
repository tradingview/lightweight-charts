import { createChart } from 'lightweight-charts';
import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { type PreviewTheme, previewTheme, themeChart } from '@tradingview/lwc-plugin-preview-kit/preview-theme';
import { BoxWhiskerSeriesOptions, createBoxWhiskerSeries, defaultOptions } from '../box-whisker-series';
import { boxWhiskerData } from './sample-data';

// The catalog preview: two sections of box plots with their outliers. The dev
// demo next door keeps a whitespace gap and shows the hovered part.
const chart = createChart('chart', { autoSize: true });

const series = createBoxWhiskerSeries(chart, { priceLineVisible: false });
series.setData(boxWhiskerData([0, 20]));
chart.timeScale().fitContent();

type Palette = 'default' | 'mono';
type BoxColors = Pick<BoxWhiskerSeriesOptions, 'whiskerColor' | 'lowerBoxColor' | 'upperBoxColor' | 'medianColor' | 'outlierColor'>;

// The whiskers, the median's overhang and the outliers are drawn on the
// background, so in dark the default's deep purple and mono's near-black
// become a light purple and a light gray, and mono's median is dark on white
// and white on black. The boxes read on both.
const boxColors: Record<Palette, Record<PreviewTheme, BoxColors>> = {
	default: {
		light: {
			whiskerColor: defaultOptions.whiskerColor,
			lowerBoxColor: defaultOptions.lowerBoxColor,
			upperBoxColor: defaultOptions.upperBoxColor,
			medianColor: defaultOptions.medianColor,
			outlierColor: defaultOptions.outlierColor,
		},
		dark: {
			whiskerColor: '#BA68C8',
			lowerBoxColor: defaultOptions.lowerBoxColor,
			upperBoxColor: defaultOptions.upperBoxColor,
			medianColor: '#BA68C8',
			outlierColor: defaultOptions.outlierColor,
		},
	},
	mono: {
		light: { whiskerColor: '#131722', lowerBoxColor: '#90BFF9', upperBoxColor: '#2962FF', medianColor: '#131722', outlierColor: '#131722' },
		dark: { whiskerColor: '#D1D4DC', lowerBoxColor: '#90BFF9', upperBoxColor: '#2962FF', medianColor: '#FFFFFF', outlierColor: '#D1D4DC' },
	},
};

let palette: Palette = 'default';
const applyColors = (theme: PreviewTheme): void => series.applyOptions(boxColors[palette][theme]);
themeChart(chart, applyColors);

mountControls([
	{
		kind: 'select',
		label: 'Colors',
		options: ['default', 'mono'],
		onChange: value => {
			palette = value as Palette;
			applyColors(previewTheme());
		},
	},
]);
