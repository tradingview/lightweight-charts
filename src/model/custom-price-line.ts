import { merge } from '../helpers/strict-type-checks';

import { CustomPriceLinePaneView } from '../views/pane/custom-price-line-pane-view';
import { IPaneView } from '../views/pane/ipane-view';
import { CustomPriceLinePriceAxisView } from '../views/price-axis/custom-price-line-price-axis-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';

import { Coordinate } from './coordinate';
import { PriceLineOptions } from './price-line-options';
import { Series } from './series';

export class CustomPriceLine {
	private readonly _series: Series;
	private readonly _priceLineView: CustomPriceLinePaneView;
	private readonly _priceAxisView: CustomPriceLinePriceAxisView;
	private readonly _options: PriceLineOptions;

	public constructor(series: Series, options: PriceLineOptions) {
		this._series = series;
		this._options = options;
		this._priceLineView = new CustomPriceLinePaneView(series, this);
		this._priceAxisView = new CustomPriceLinePriceAxisView(series, this);
	}

	public applyOptions(options: Partial<PriceLineOptions>): void {
		merge(this._options, options);
		this.update();
		this._series.model().lightUpdate();
	}

	public options(): PriceLineOptions {
		return this._options;
	}

	public paneView(): IPaneView {
		return this._priceLineView;
	}

	public priceAxisView(): IPriceAxisView {
		return this._priceAxisView;
	}

	public update(): void {
		this._priceLineView.update();
		this._priceAxisView.update();
	}

	public yCoord(): Coordinate | null {
		const series = this._series;
		const priceScale = series.priceScale();
		const timeScale = series.model().timeScale();

		if (timeScale.isEmpty() || priceScale.isEmpty()) {
			return null;
		}

		const firstValue = series.firstValue();
		if (firstValue === null) {
			return null;
		}

		return priceScale.priceToCoordinate(this._options.price, firstValue.value);
	}
}
