import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { TimeAxisView } from '../views/time-axis/time-axis-view';

import { IDataSource } from './idata-source';
import { Pane } from './pane';
import { PriceScale } from './price-scale';

export abstract class DataSource implements IDataSource {
	protected _priceScale: PriceScale | null = null;

	private _zorder: number = 0;

	public zorder(): number {
		return this._zorder;
	}

	public setZorder(zorder: number): void {
		this._zorder = zorder;
	}

	public priceScale(): PriceScale | null {
		return this._priceScale;
	}

	public setPriceScale(priceScale: PriceScale | null): void {
		this._priceScale = priceScale;
	}

	public priceAxisViews(pane?: Pane, priceScale?: PriceScale): ReadonlyArray<IPriceAxisView> {
		return [];
	}

	public paneViews(pane?: Pane): ReadonlyArray<IPaneView> {
		return [];
	}

	public timeAxisViews(): ReadonlyArray<TimeAxisView> {
		return [];
	}

	public abstract updateAllViews(): void;
}
