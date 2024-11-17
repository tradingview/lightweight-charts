import { HoveredObject } from '../model/chart-model';
import { Coordinate } from '../model/coordinate';
import { IPriceDataSource } from '../model/iprice-data-source';
import { Pane } from '../model/pane';
import { IPaneView } from '../views/pane/ipane-view';
export interface HitTestResult {
    source: IPriceDataSource;
    object?: HoveredObject;
    view?: IPaneView;
    cursorStyle?: string;
}
export interface HitTestPaneViewResult {
    view: IPaneView;
    object?: HoveredObject;
}
export declare function hitTestPane(pane: Pane, x: Coordinate, y: Coordinate): HitTestResult | null;
