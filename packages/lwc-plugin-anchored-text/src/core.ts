import { IPrimitivePaneView } from 'lightweight-charts';

import {
	AnchoredTextInputOptions,
	AnchoredTextOptions,
	mergeOptions,
	resolveOptions,
} from './options.js';
import { AnchoredTextPaneView } from './renderer.js';

/**
 * The text itself: options and the pane view. The two public classes are thin
 * lifecycle wrappers around it, one for a series and one for a pane.
 */
export class AnchoredTextCore {
	private readonly _requestUpdate: () => void;
	private readonly _paneViews: readonly AnchoredTextPaneView[];
	private _options: AnchoredTextOptions;

	public constructor(requestUpdate: () => void, options?: AnchoredTextInputOptions) {
		this._requestUpdate = requestUpdate;
		this._options = resolveOptions(options);
		this._paneViews = [new AnchoredTextPaneView(this._state())];
	}

	public updateAllViews(): void {
		const state = this._state();
		this._paneViews.forEach(view => view.update(state));
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews;
	}

	public options(): Readonly<AnchoredTextOptions> {
		return { ...this._options };
	}

	public applyOptions(options: AnchoredTextInputOptions): void {
		this._options = mergeOptions(this._options, options);
		this.updateAllViews();
		this._requestUpdate();
	}

	private _state(): { options: AnchoredTextOptions } {
		return { options: this._options };
	}
}
