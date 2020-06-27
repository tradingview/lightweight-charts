import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';

import { Pane } from './pane';
import { PriceScale } from './price-scale';

export interface IDataSource {
	zorder(): number | null;
	setZorder(value: number): void;
	priceScale(): PriceScale | null;
	setPriceScale(scale: PriceScale | null): void;

	updateAllViews(): void;

	priceAxisViews(pane?: Pane, priceScale?: PriceScale): readonly IPriceAxisView[];
	timeAxisViews(): readonly ITimeAxisView[];
	paneViews(pane: Pane): readonly IPaneView[];

	destroy?(): void;
}
