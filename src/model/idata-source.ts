import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';

import { IPaneBase } from './pane';
import { PriceScale } from './price-scale';

export interface ZOrdered {
	zorder(): number;
}

export interface IDataSourceBase extends ZOrdered {
	setZorder(value: number): void;
	priceScale(): PriceScale | null;
	setPriceScale(scale: PriceScale | null): void;

	updateAllViews(): void;

	priceAxisViews(pane?: IPaneBase, priceScale?: PriceScale): readonly IPriceAxisView[];
	paneViews(pane: IPaneBase): readonly IPaneView[];
	labelPaneViews(pane?: IPaneBase): readonly IPaneView[];

	/**
	 * Pane views that are painted on the most top layer
	 */
	topPaneViews?(pane: IPaneBase): readonly IPaneView[];

	visible(): boolean;

	destroy?(): void;
}

export interface IDataSource<HorzScaleItem> extends IDataSourceBase {
	timeAxisViews(): readonly ITimeAxisView<HorzScaleItem>[];
}