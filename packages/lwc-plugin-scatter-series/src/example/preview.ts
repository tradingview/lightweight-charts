import { mountControls } from '@tradingview/lwc-plugin-preview-kit/preview-controls';
import '@tradingview/lwc-plugin-preview-kit/preview.css';
import { createScatterChart } from '../chart';
import type { ScatterShape } from '../options';
import { createScatterSeries } from '../scatter-series';
import { Trade, winLossTrades } from './sample-data';

// The catalogue preview: winning and losing trades, sized by how long they
// were held. The dev demo next door has every scenario of the design.
const chart = createScatterChart('chart', {
	autoSize: true,
	layout: { attributionLogo: false },
	grid: { vertLines: { color: '#E0E3EB' }, horzLines: { color: '#E0E3EB' } },
});

const series = createScatterSeries<Trade>(chart, {
	groups: [
		{ id: 'win', name: 'Win trades', color: '#089981' },
		{ id: 'loss', name: 'Loss trades', color: '#F23645' },
	],
	baselines: [{ axis: 'y', value: 0 }],
	priceFormat: {
		type: 'custom',
		minMove: 1000,
		formatter: (value: number) => `${(value / 1000).toFixed(0)}K`,
	},
});
series.setData(winLossTrades(7));

mountControls([
	{
		kind: 'select',
		label: 'Size',
		options: [
			{ value: 'value', label: 'by duration' },
			{ value: 'fixed', label: 'fixed' },
		],
		onChange: value => series.setData(
			winLossTrades(7).map((trade: Trade) => (value === 'fixed' ? { ...trade, sizeValue: undefined } : trade))
		),
	},
	{
		kind: 'select',
		label: 'Shape',
		options: ['circle', 'square', 'diamond', 'triangleUp', 'triangleDown'],
		onChange: value => series.applyOptions({ shape: value as ScatterShape }),
	},
	{
		kind: 'checkbox',
		label: 'Open markers',
		onChange: checked => series.applyOptions({ hollow: checked }),
	},
	{
		kind: 'checkbox',
		label: 'Border',
		onChange: checked => series.applyOptions({ plotBorder: { visible: checked } }),
	},
]);
