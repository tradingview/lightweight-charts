import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { Coordinate } from './coordinate';
import { PriceLineOptions } from './price-line-options';
import { ISeries } from './series';
import { SeriesType } from './series-options';
export declare class CustomPriceLine {
    private readonly _series;
    private readonly _priceLineView;
    private readonly _priceAxisView;
    private readonly _panePriceAxisView;
    private readonly _options;
    constructor(series: ISeries<SeriesType>, options: PriceLineOptions);
    applyOptions(options: Partial<PriceLineOptions>): void;
    options(): PriceLineOptions;
    paneView(): IPaneView;
    labelPaneView(): IPaneView;
    priceAxisView(): IPriceAxisView;
    update(): void;
    yCoord(): Coordinate | null;
}
