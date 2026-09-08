import { IPanePrimitivePaneView, Time } from 'lightweight-charts';
import { PanePluginBase } from '@tradingview/lwc-toolkit/pane-plugin-base';
import { _CLASSNAME_Options, defaultOptions } from './options';
import { _CLASSNAME_PaneView } from './pane-view';

/**
 * A pane primitive which draws a text label in one corner of the pane.
 *
 * Pane primitives are attached to a pane rather than to a series, so they are
 * a good fit for pane-level decoration: titles, badges, legends, watermarks.
 */
export class _CLASSNAME_<T = Time> extends PanePluginBase<T> {
	private _options: _CLASSNAME_Options;
	private _paneViews: _CLASSNAME_PaneView[];

	constructor(options: Partial<_CLASSNAME_Options> = {}) {
		//* PanePluginBase implements the attached / detached lifecycle hooks: it
		//* keeps the chart (this.chart) and provides this.requestUpdate(). Override
		//* attached() / detached() — calling super — if the primitive needs to
		//* acquire and release anything of its own.
		super();
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

	public get options(): _CLASSNAME_Options {
		return this._options;
	}

	applyOptions(options: Partial<_CLASSNAME_Options>) {
		this._options = { ...this._options, ...options };
		this.updateAllViews();
		//* Ask the chart to redraw. Does nothing while the primitive is detached.
		this.requestUpdate();
	}
}
