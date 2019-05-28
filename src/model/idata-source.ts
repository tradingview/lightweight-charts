import { ISubscription } from '../helpers/isubscription';

import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { TimeAxisView } from '../views/time-axis/time-axis-view';

import { Pane } from './pane';
import { PriceScale } from './price-scale';

export interface DataSourceTextIcon {
	type: 'text';
	text: string;
}

export interface DataSourceSvgIcon {
	type: 'svg';
	svgCode: string;
}

export type DataSourceIcon = DataSourceTextIcon | DataSourceSvgIcon;

export interface IDataSource {
	zorder(): number | null;
	setZorder(value: number): void;
	priceScale(): PriceScale | null;
	setPriceScale(scale: PriceScale | null): void;

	isVisible(): boolean;
	updateAllViews(): void;

	priceAxisViews(pane?: Pane, priceScale?: PriceScale): ReadonlyArray<IPriceAxisView>;
	timeAxisViews(): ReadonlyArray<TimeAxisView>;
	paneViews(pane: Pane): ReadonlyArray<IPaneView>;

	onPriceScaleChanged(): ISubscription;

	destroy?(): void;
}
