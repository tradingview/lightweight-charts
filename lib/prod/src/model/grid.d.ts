import { LineStyle } from '../renderers/draw-line';
import { IUpdatablePaneView } from '../views/pane/iupdatable-pane-view';
import { Pane } from './pane';
/** Grid line options. */
export interface GridLineOptions {
    /**
     * Line color.
     *
     * @defaultValue `'#D6DCDE'`
     */
    color: string;
    /**
     * Line style.
     *
     * @defaultValue {@link LineStyle.Solid}
     */
    style: LineStyle;
    /**
     * Display the lines.
     *
     * @defaultValue `true`
     */
    visible: boolean;
}
/** Structure describing grid options. */
export interface GridOptions {
    /**
     * Vertical grid line options.
     */
    vertLines: GridLineOptions;
    /**
     * Horizontal grid line options.
     */
    horzLines: GridLineOptions;
}
export declare class Grid {
    private _paneView;
    constructor(pane: Pane);
    paneView(): IUpdatablePaneView;
}
