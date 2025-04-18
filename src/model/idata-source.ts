import { IAxisView } from '../views/pane/iaxis-view';
import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';

import { Coordinate } from './coordinate';
import { PrimitiveHoveredItem, PrimitivePaneViewZOrder } from './ipane-primitive';
import { Pane } from './pane';
import { PriceScale } from './price-scale';

export interface IPrimitiveHitTestSource {
	primitiveHitTest?(x: Coordinate, y: Coordinate): PrimitiveHoveredItem[];
}

export interface ZOrdered {
	zorder(): number;
}
/**
 * Prefix meanings:
 * - bottom: Pane views that are painted at the bottom (above background color, below grid lines)
 * - top: Pane views that are painted on the most top layer and ABOVE the crosshair
 */
interface IPluginPaneViews extends IPrimitiveHitTestSource {
	bottomPaneViews?(pane: Pane): readonly IPaneView[];
	pricePaneViews?(zOrder: PrimitivePaneViewZOrder): readonly IAxisView[];
	timePaneViews?(zOrder: PrimitivePaneViewZOrder): readonly IAxisView[];
}

export interface IDataSourcePaneViews extends IPluginPaneViews {
	paneViews(pane: Pane): readonly IPaneView[];
	labelPaneViews(pane?: Pane): readonly IPaneView[];

	/**
	 * Pane views that are painted on the most top layer
	 */
	topPaneViews?(pane: Pane): readonly IPaneView[];
}

export type DataSourcePaneViewGetterNames = keyof IDataSourcePaneViews;

export interface IDataSource extends IDataSourcePaneViews, ZOrdered {
	setZorder(value: number): void;
	priceScale(): PriceScale | null;
	setPriceScale(scale: PriceScale | null): void;

	updateAllViews(): void;

	priceAxisViews(pane?: Pane, priceScale?: PriceScale): readonly IPriceAxisView[];
	paneViews(pane: Pane): readonly IPaneView[];
	labelPaneViews(pane?: Pane): readonly IPaneView[];

	/**
	 * Pane views that are painted on the most top layer
	 */
	topPaneViews?(pane: Pane): readonly IPaneView[];
	timeAxisViews(): readonly ITimeAxisView[];

	visible(): boolean;

	destroy?(): void;
}
