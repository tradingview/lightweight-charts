import {
	CustomStyleOptions,
	PriceLineSource,
	SeriesOptionsCommon,
} from '../../model/series-options';
import { LineStyle } from '../../renderers/draw-line';

export const customStyleDefaults: CustomStyleOptions = {
	color: '#2196f3',
};

export const seriesOptionsDefaults: SeriesOptionsCommon = {
	title: '',
	visible: true,
	lastValueVisible: true,
	priceLineVisible: true,
	priceLineSource: PriceLineSource.LastBar,
	priceLineWidth: 1,
	priceLineColor: '',
	priceLineStyle: LineStyle.Dashed,
	baseLineVisible: true,
	baseLineWidth: 1,
	baseLineColor: '#B2B5BE',
	baseLineStyle: LineStyle.Solid,
	priceFormat: {
		type: 'price',
		precision: 2,
		minMove: 0.01,
	},
};
