import { IPanePrimitive, IPanePrimitivePaneView, PaneAttachedParameter, Time } from 'lightweight-charts';
import { _CLASSNAME_Options, defaultOptions } from './options';
import { _CLASSNAME_PaneView } from './pane-view';

/**
 * A pane primitive which draws a text label in one corner of the pane.
 *
 * Pane primitives are attached to a pane rather than to a series, so they are
 * a good fit for pane-level decoration: titles, badges, legends, watermarks.
 */
export class _CLASSNAME_<T = Time> implements IPanePrimitive<T> {
	_options: _CLASSNAME_Options;
	_paneViews: _CLASSNAME_PaneView[];
	_requestUpdate?: () => void;

	constructor(options: Partial<_CLASSNAME_Options> = {}) {
		this._options = {
			...defaultOptions,
			...options,
		};
		this._paneViews = [new _CLASSNAME_PaneView(this._options)];
	}

	updateAllViews() {
		//* Use this method to update any data required by the views to draw.
		this._paneViews.forEach(pv => pv.update(this._options));
	}

	paneViews(): readonly IPanePrimitivePaneView[] {
		//* rendering on the pane the primitive is attached to
		return this._paneViews;
	}

	attached({ requestUpdate }: PaneAttachedParameter<T>): void {
		//* Attached lifecycle hook. Keep hold of requestUpdate so the primitive
		//* can ask the chart to redraw when its own state changes.
		this._requestUpdate = requestUpdate;
	}

	detached(): void {
		//* Detached lifecycle hook. Release anything acquired in attached().
		this._requestUpdate = undefined;
	}

	public get options(): _CLASSNAME_Options {
		return this._options;
	}

	applyOptions(options: Partial<_CLASSNAME_Options>) {
		this._options = { ...this._options, ...options };
		this.updateAllViews();
		this._requestUpdate?.();
	}
}
