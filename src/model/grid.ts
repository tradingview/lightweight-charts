import { LineStyle } from '../renderers/draw-line';
import { GridPaneView } from '../views/pane/grid-pane-view';
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

export class Grid {
	private _paneView: GridPaneView;

	public constructor(pane: Pane) {
		this._paneView = new GridPaneView(pane);
	}

	public paneView(): IUpdatablePaneView {
		return this._paneView;
	}
}
