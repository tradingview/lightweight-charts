import { ensure } from '../helpers/assertions';

import { Coordinate } from './coordinate';
import { CrosshairMode, CrosshairOptions } from './crosshair';
import { IPriceDataSource } from './iprice-data-source';
import { Pane } from './pane';
import { Series } from './series';
import { SeriesPlotIndex } from './series-data';
import { TimePointIndex } from './time-data';

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
		const serieses: ReadonlyArray<Series> = pane.dataSources().filter(
			((ds: IPriceDataSource) => (ds instanceof Series)) as (ds: IPriceDataSource) => ds is Series);

		const candidates = serieses.reduce(
			(acc: Coordinate[], series: Series) => {
				if (pane.isOverlay(series)) {
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
				const prices = [
					bar.value[SeriesPlotIndex.Close] as number,
				];

				// convert bar to pixels
				const firstPrice = ensure(series.firstValue());
				return acc.concat(prices.map((barPrice: number) => ps.priceToCoordinate(barPrice, firstPrice.value)));
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
