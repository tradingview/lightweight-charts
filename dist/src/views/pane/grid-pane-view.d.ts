import { Pane } from '../../model/pane';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IUpdatablePaneView } from './iupdatable-pane-view';
export declare class GridPaneView implements IUpdatablePaneView {
    private readonly _pane;
    private readonly _renderer;
    private _invalidated;
    constructor(pane: Pane);
    update(): void;
    renderer(): IPaneRenderer | null;
}
