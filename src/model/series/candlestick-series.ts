
import { IUpdatablePaneView } from '../../views/pane/iupdatable-pane-view';

import { IChartModelBase } from '../chart-model';
import { ISeries } from '../series';
import { CandlestickStyleOptions } from '../series-options';
import { SeriesCandlesticksPaneView } from './candlesticks-pane-view';
import { BuiltInSeriesDefinition } from './series-def';

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

export class CandlestickSeries implements BuiltInSeriesDefinition<'Candlestick'> {
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly type = 'Candlestick' as const;
	// eslint-disable-next-line @typescript-eslint/tslint/config
	public readonly isBuiltIn = true as const;
	public readonly defaultOptions: CandlestickStyleOptions = candlestickStyleDefaults;
	/**
	* @internal
	*/
	public createPaneView(series: ISeries<'Candlestick'>, model: IChartModelBase): IUpdatablePaneView {
		return new SeriesCandlesticksPaneView(series, model);
	}
}

export const candlestickSeries = new CandlestickSeries();
