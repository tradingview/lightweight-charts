import { ensure } from '../helpers/assertions';

import { Coordinate } from './coordinate';
import { CrosshairMode, CrosshairOptions } from './crosshair';
import { IPriceDataSource } from './iprice-data-source';
import { ISeries } from './iseries';
import { Pane } from './pane';
import { PlotRowValueIndex } from './plot-data';
import { Series } from './series';
import { SeriesType } from './series-options';
import { TimePointIndex } from './time-data';

const magnetPlotRowKeys: readonly PlotRowValueIndex[] = [
	PlotRowValueIndex.Close,
] as const;
const magnetOHLCPlotRowKeys: readonly PlotRowValueIndex[] = [
	PlotRowValueIndex.Open,
	PlotRowValueIndex.High,
	PlotRowValueIndex.Low,
	PlotRowValueIndex.Close,
] as const;

export class Magnet {
	private readonly _options: CrosshairOptions;

	public constructor(options: CrosshairOptions) {
		this._options = options;
	}

	public align(price: number, index: TimePointIndex, pane: Pane): number {
		let res = price;
		if (this._options.mode === CrosshairMode.Normal) {
			return res;
		}

		const defaultPriceScale = pane.defaultPriceScale();
		const firstValue = defaultPriceScale.firstValue();

		if (firstValue === null) {
			return res;
		}

		const y = defaultPriceScale.priceToCoordinate(price, firstValue);

		// get all serieses from the pane
		const serieses: readonly ISeries<SeriesType>[] = pane.dataSources().filter(
			((ds: IPriceDataSource) => (ds instanceof Series)) as (ds: IPriceDataSource) => ds is Series<SeriesType>);

		const candidates = serieses.reduce(
			(acc: Coordinate[], series: ISeries<SeriesType>) => {
				if (pane.isOverlay(series) || !series.visible()) {
					return acc;
				}
				const ps = series.priceScale();
				const bars = series.bars();
				if (ps.isEmpty() || !bars.contains(index)) {
					return acc;
				}

				const bar = bars.valueAt(index);
				if (bar === null) {
					return acc;
				}

				// convert bar to pixels
				const firstPrice = ensure(series.firstValue());
				const plotRowKeys = this._options.mode === CrosshairMode.MagnetOHLC
					? magnetOHLCPlotRowKeys
					: magnetPlotRowKeys;
				return acc.concat(
					plotRowKeys.map((key: PlotRowValueIndex) => ps.priceToCoordinate(bar.value[key], firstPrice.value))
				);
			},
			[] as Coordinate[]);

		if (candidates.length === 0) {
			return res;
		}

		candidates.sort((y1: Coordinate, y2: Coordinate) => Math.abs(y1 - y) - Math.abs(y2 - y));

		const nearest = candidates[0];
		res = defaultPriceScale.coordinateToPrice(nearest, firstValue);

		return res;
	}
}
