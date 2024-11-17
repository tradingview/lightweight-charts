import { Crosshair } from '../../model/crosshair';
import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IPaneView } from './ipane-view';
export declare class CrosshairPaneView implements IPaneView {
    private _invalidated;
    private readonly _source;
    private readonly _rendererData;
    private _renderer;
    constructor(source: Crosshair);
    update(): void;
    renderer(): IPaneRenderer;
    private _updateImpl;
}
