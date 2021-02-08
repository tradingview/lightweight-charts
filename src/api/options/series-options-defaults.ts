import {
	AreaStyleOptions,
	BarStyleOptions,
	CandlestickStyleOptions, CloudAreaStyleOptions,
	HistogramStyleOptions,
	LineStyleOptions,
	PriceLineSource,
	SeriesOptionsCommon,
} from '../../model/series-options';
import { LineStyle, LineType } from '../../renderers/draw-line';

export const candlestickStyleDefaults: CandlestickStyleOptions = {
	upColor: '#26a69a',
	downColor: '#ef5350',
	wickVisible: true,
	borderVisible: true,
	borderColor: '#378658',
	borderUpColor: '#26a69a',
	borderDownColor: '#ef5350',
	wickColor: '#737375',
	wickUpColor: '#26a69a',
	wickDownColor: '#ef5350',
};

export const barStyleDefaults: BarStyleOptions = {
	upColor: '#26a69a',
	downColor: '#ef5350',
	openVisible: true,
	thinBars: true,
};

export const lineStyleDefaults: LineStyleOptions = {
	color: '#2196f3',
	lineStyle: LineStyle.Solid,
	lineWidth: 3,
	lineType: LineType.Simple,
	crosshairMarkerVisible: true,
	crosshairMarkerRadius: 4,
	crosshairMarkerBorderColor: '',
	crosshairMarkerBackgroundColor: '',
};

export const areaStyleDefaults: AreaStyleOptions = {
	topColor: 'rgba( 46, 220, 135, 0.4)',
	bottomColor: 'rgba( 40, 221, 100, 0)',
	lineColor: '#33D778',
	lineStyle: LineStyle.Solid,
	lineWidth: 3,
	lineType: LineType.Simple,
	crosshairMarkerVisible: true,
	crosshairMarkerRadius: 4,
	crosshairMarkerBorderColor: '',
	crosshairMarkerBackgroundColor: '',
};

export const cloudAreaStyleDefaults: CloudAreaStyleOptions = {
	positiveColor: 'rgba( 76, 175, 80, 0.1)',
	negativeColor: 'rgba( 255, 82, 82, 0.1)',
	higherLineColor: '#4CAF50',
	higherLineStyle: 0,
	higherLineWidth: 3,
	higherLineType: 0,
	lowerLineColor: '#FF5252',
	lowerLineStyle: 0,
	lowerLineWidth: 3,
	lowerLineType: 0,
	crosshairMarkerVisible: true,
	crosshairMarkerRadius: 4,
	crosshairMarkerBorderColor: '',
	crosshairMarkerBackgroundColor: '',
};

export const histogramStyleDefaults: HistogramStyleOptions = {
	color: '#26a69a',
	base: 0,
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
