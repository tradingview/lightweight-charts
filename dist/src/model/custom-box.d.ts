import { IPaneView } from '../views/pane/ipane-view';
import { BoxOptions } from './box-options';
import { Coordinate } from './coordinate';
import { Series } from './series';
import { SeriesType } from './series-options';
export declare class CustomBox {
    private readonly _series;
    private readonly _boxView;
    private readonly _options;
    constructor(series: Series<SeriesType>, options: BoxOptions);
    applyOptions(options: Partial<BoxOptions>): void;
    options(): BoxOptions;
    paneView(): IPaneView;
    update(): void;
    xLowCoord(): Coordinate | null;
    xHighCoord(): Coordinate | null;
    yLowCoord(): Coordinate | null;
    yHighCoord(): Coordinate | null;
    xCoord(time: number): Coordinate | null;
    yCoord(price: number): Coordinate | null;
}
