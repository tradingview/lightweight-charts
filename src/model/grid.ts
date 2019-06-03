import { LineStyle } from '../renderers/draw-line';
import { GridPaneView } from '../views/pane/grid-pane-view';
import { IPaneView } from '../views/pane/ipane-view';

import { Pane } from './pane';

/** Structure describing horizontal or vertical grid line options */
export interface GridLineOptions {
	/** Color of the lines */
	color: string;
	/** Style of the lines */
	style: LineStyle;
	/** Visibility of the lines */
	visible: boolean;
}

/** Structure describing grid options */
export interface GridOptions {
	/** Vertical grid line options */
	vertLines: GridLineOptions;
	/** Horizontal grid line options */
	horzLines: GridLineOptions;
}

export class Grid {
	private _paneViews: WeakMap<Pane, GridPaneView[]> = new WeakMap();
	private _invalidated: boolean = true;

	public paneViews(pane: Pane): ReadonlyArray<IPaneView> {
		let paneViews = this._paneViews.get(pane);
		if (paneViews === undefined) {
			paneViews = [new GridPaneView(pane)];
			this._paneViews.set(pane, paneViews);
		}

		if (this._invalidated) {
			paneViews.forEach((view: GridPaneView) => view.update());
			this._invalidated = false;
		}

		return paneViews;
	}

	public invalidate(): void {
		this._invalidated = true;
	}
}
