import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';

import { Pane } from './pane';
import { PriceScale } from './price-scale';

export interface IDataSource<HorzScaleItem> {
	zorder(): number | null;
	setZorder(value: number): void;
	priceScale(): PriceScale<HorzScaleItem> | null;
	setPriceScale(scale: PriceScale<HorzScaleItem> | null): void;

	updateAllViews(): void;

	priceAxisViews(pane?: Pane<HorzScaleItem>, priceScale?: PriceScale<HorzScaleItem>): readonly IPriceAxisView<HorzScaleItem>[];
	timeAxisViews(): readonly ITimeAxisView<HorzScaleItem>[];
	paneViews(pane: Pane<HorzScaleItem>): readonly IPaneView[];
	labelPaneViews(pane?: Pane<HorzScaleItem>): readonly IPaneView[];

	/**
	 * Pane views that are painted on the most top layer
	 */
	topPaneViews?(pane: Pane<HorzScaleItem>): readonly IPaneView[];

	visible(): boolean;

	destroy?(): void;
}
