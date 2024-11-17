import { CrosshairOptions } from './crosshair';
import { Pane } from './pane';
import { TimePointIndex } from './time-data';
export declare class Magnet {
    private readonly _options;
    constructor(options: CrosshairOptions);
    align(price: number, index: TimePointIndex, pane: Pane): number;
}
