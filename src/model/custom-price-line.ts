import { merge } from '../helpers/strict-type-checks';

import { CustomPriceLinePaneView } from '../views/pane/custom-price-line-pane-view';
import { IPaneView } from '../views/pane/ipane-view';

import { PriceLineOptions } from './price-line-options';
import { Series } from './series';

export class CustomPriceLine {
	private readonly _series: Series;
	private readonly _priceLineView: CustomPriceLinePaneView;
	private readonly _options: PriceLineOptions;

	public constructor(series: Series, options: PriceLineOptions) {
		this._series = series;
		this._options = options;
		this._priceLineView = new CustomPriceLinePaneView(series, this);
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

	public update(): void {
		this._priceLineView.update();
	}
}
