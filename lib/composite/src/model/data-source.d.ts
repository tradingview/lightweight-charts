import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';
import { IDataSource } from './idata-source';
import { Pane } from './pane';
import { PriceScale } from './price-scale';
export declare abstract class DataSource implements IDataSource {
    protected _priceScale: PriceScale | null;
    private _zorder;
    zorder(): number;
    setZorder(zorder: number): void;
    priceScale(): PriceScale | null;
    setPriceScale(priceScale: PriceScale | null): void;
    abstract priceAxisViews(pane?: Pane, priceScale?: PriceScale): readonly IPriceAxisView[];
    abstract paneViews(pane?: Pane): readonly IPaneView[];
    labelPaneViews(pane?: Pane): readonly IPaneView[];
    timeAxisViews(): readonly ITimeAxisView[];
    visible(): boolean;
    abstract updateAllViews(): void;
}
