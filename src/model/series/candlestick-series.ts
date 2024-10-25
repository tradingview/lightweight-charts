
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { Series, SeriesOptionsInternal } from '../series';
import { CandlestickStyleOptions } from '../series-options';
import { SeriesCandlesticksPaneView } from './candlesticks-pane-view';
import { SeriesDefinition } from './series-def';

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
const seriesType = 'Candlestick';
const createPaneView = (series: Series<typeof seriesType>, model: IChartModelBase): IUpdatablePaneView => new SeriesCandlesticksPaneView(series, model);

export const candlestickSeries: SeriesDefinition<typeof seriesType> = {
	type: seriesType,
	isBuiltIn: true as const,
	defaultOptions: candlestickStyleDefaults,
	createSeries: (model: IChartModelBase, options: SeriesOptionsInternal<typeof seriesType>): Series<typeof seriesType> => {
		return new Series<typeof seriesType>(model, seriesType, options, createPaneView);
	},
};
