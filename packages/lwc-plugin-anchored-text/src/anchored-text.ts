import { PanePluginBase } from '@tradingview/lwc-toolkit/pane-plugin-base';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';
import { IPrimitivePaneView, Time } from 'lightweight-charts';

import { AnchoredTextCore } from './core.js';
import { AnchoredTextInputOptions, AnchoredTextOptions } from './options.js';

export {
	defaultOptions,
	type AnchoredTextHorzAlign,
	type AnchoredTextInputOptions,
	type AnchoredTextOptions,
	type AnchoredTextVertAlign,
	type LegacyMiddleAlign,
} from './options.js';

/**
 * A line of text anchored to an edge, a corner or the center of the pane the
 * attached series is drawn in. Attach it with `series.attachPrimitive(text)`.
 */
export class AnchoredText extends PluginBase {
	private readonly _core: AnchoredTextCore;

	public constructor(options?: AnchoredTextInputOptions) {
		super();
		this._core = new AnchoredTextCore(() => this.requestUpdate(), options);
	}

	public updateAllViews(): void {
		this._core.updateAllViews();
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._core.paneViews();
	}

	/** The current options, with every default filled in. */
	public options(): Readonly<AnchoredTextOptions> {
		return this._core.options();
	}

	/** Changes any subset of the options. An option left out is not changed. */
	public applyOptions(options: AnchoredTextInputOptions): void {
		this._core.applyOptions(options);
	}

	/** Replaces the text. Shorthand for `applyOptions({ text })`. */
	public setText(text: string): void {
		this._core.applyOptions({ text });
	}
}

/**
 * The same text attached to a pane instead of a series, for a chart whose
 * series come and go. Attach it with `chart.panes()[0].attachPrimitive(...)`.
 */
export class AnchoredTextPane extends PanePluginBase<Time> {
	private readonly _core: AnchoredTextCore;

	public constructor(options?: AnchoredTextInputOptions) {
		super();
		this._core = new AnchoredTextCore(() => this.requestUpdate(), options);
	}

	public updateAllViews(): void {
		this._core.updateAllViews();
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._core.paneViews();
	}

	/** The current options, with every default filled in. */
	public options(): Readonly<AnchoredTextOptions> {
		return this._core.options();
	}

	/** Changes any subset of the options. An option left out is not changed. */
	public applyOptions(options: AnchoredTextInputOptions): void {
		this._core.applyOptions(options);
	}

	/** Replaces the text. Shorthand for `applyOptions({ text })`. */
	public setText(text: string): void {
		this._core.applyOptions({ text });
	}
}
