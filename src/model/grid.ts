import { LineStyle } from '../renderers/draw-line';
import { GridPaneView } from '../views/pane/grid-pane-view';
import { IPaneView } from '../views/pane/ipane-view';

import { Pane } from './pane';

export interface GridLineOptions {
	color: string;
	style: LineStyle;
	visible: boolean;
}

export interface GridOptions {
	vertLines: GridLineOptions;
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
