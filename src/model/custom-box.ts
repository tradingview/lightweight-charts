import { merge } from '../helpers/strict-type-checks';

import { CustomBoxPaneView } from '../views/pane/custom-box-pane-view';
import { IPaneView } from '../views/pane/ipane-view';
// TODO: show prices for box Y coords
// import { PanePriceAxisView } from '../views/pane/pane-price-axis-view';
// import { CustomPriceLinePriceAxisView } from '../views/price-axis/custom-price-line-price-axis-view';
// import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';

import { BoxOptions } from './box-options';
import { Coordinate } from './coordinate';
import { Series } from './series';
import { UTCTimestamp } from './time-data';

export class CustomBox {
	private readonly _series: Series;
	private readonly _boxView: CustomBoxPaneView;
	// private readonly _priceAxisView: CustomPriceLinePriceAxisView;
	// private readonly _panePriceAxisView: PanePriceAxisView;
	private readonly _options: BoxOptions;

	public constructor(series: Series, options: BoxOptions) {
		this._series = series;
		this._options = options;
		this._boxView = new CustomBoxPaneView(series, this);
		// this._priceAxisView = new CustomPriceLinePriceAxisView(series, this);
		// this._panePriceAxisView = new PanePriceAxisView(this._priceAxisView, series, series.model());
	}

	public applyOptions(options: Partial<BoxOptions>): void {
		merge(this._options, options);
		this.update();
		this._series.model().lightUpdate();
	}

	public options(): BoxOptions {
		return this._options;
	}

	public paneView(): IPaneView {
		return this._boxView;
	}

	// public labelPaneView(): IPaneView {
	// 	return this._panePriceAxisView;
	// }

	// public priceAxisView(): IPriceAxisView {
	// 	return this._priceAxisView;
	// }

	public update(): void {
		this._boxView.update();
		// this._priceAxisView.update();
	}

	public xLowCoord(): Coordinate | null {
		return this._xCoord(this._options.earlyTime as UTCTimestamp);
	}

	public xHighCoord(): Coordinate | null {
		return this._xCoord(this._options.lateTime as UTCTimestamp);
	}

	public yLowCoord(): Coordinate | null {
		// low Y coord = the high price (it is intentionally flipped)
		return this._yCoord(this._options.highPrice);
	}

	public yHighCoord(): Coordinate | null {
		// high Y coord = the low price (it is intentionally flipped)
		return this._yCoord(this._options.lowPrice);
	}

	private _xCoord(time: UTCTimestamp): Coordinate | null {
		const series = this._series;
		const timeScale = series.model().timeScale();
		const timeIndex = timeScale.timeToIndex({ timestamp: time }, true);

		if (timeScale.isEmpty() || timeIndex === null) {
			return null;
		}

		return timeScale.indexToCoordinate(timeIndex);
	}

	private _yCoord(price: number): Coordinate | null {
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

		return priceScale.priceToCoordinate(price, firstValue.value);
	}
}
