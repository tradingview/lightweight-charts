import { PanePluginBase } from '@tradingview/lwc-toolkit/pane-plugin-base';
import { PluginBase } from '@tradingview/lwc-toolkit/plugin-base';
import {
	IPrimitivePaneView,
	PaneAttachedParameter,
	SeriesAttachedParameter,
	Time,
} from 'lightweight-charts';

import { ImageWatermarkCore } from './core.js';
import { ImageWatermarkPluginOptions } from './options.js';

export {
	defaultOptions,
	type ImageCrossOrigin,
	type ImageWatermarkOptions,
	type ImageWatermarkPluginOptions,
	type WatermarkAnchor,
	type WatermarkAnchorPoint,
	type WatermarkObjectFit,
	type WatermarkPosition,
} from './options.js';

/**
 * A watermark image drawn behind the series it is attached to.
 *
 * The image is loaded when the primitive is attached and drawn once it has
 * been decoded; nothing is drawn before that, or if the image fails to load.
 */
export class ImageWatermark extends PluginBase {
	private readonly _core: ImageWatermarkCore;

	public constructor(imageUrl?: string, options?: ImageWatermarkPluginOptions) {
		super();
		this._core = new ImageWatermarkCore(
			() => this.requestUpdate(),
			imageUrl,
			options
		);
	}

	public override attached(param: SeriesAttachedParameter<Time>): void {
		super.attached(param);
		this._core.attach();
	}

	public override detached(): void {
		this._core.detach();
		super.detached();
	}

	public updateAllViews(): void {
		this._core.updateAllViews();
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._core.paneViews();
	}

	/** The current options, with every default filled in. */
	public options(): Readonly<ImageWatermarkPluginOptions> {
		return this._core.options();
	}

	/** Changes any subset of the options. An option left out is not changed. */
	public applyOptions(options: ImageWatermarkPluginOptions): void {
		this._core.applyOptions(options);
	}

	/** Replaces the image. Shorthand for `applyOptions({ imageUrl })`. */
	public setImage(imageUrl: string): void {
		this._core.applyOptions({ imageUrl });
	}
}

/**
 * The same watermark attached to a pane instead of a series, for a chart whose
 * series come and go. Attach it with `chart.panes()[0].attachPrimitive(...)`.
 */
export class ImageWatermarkPane extends PanePluginBase<Time> {
	private readonly _core: ImageWatermarkCore;

	public constructor(imageUrl?: string, options?: ImageWatermarkPluginOptions) {
		super();
		this._core = new ImageWatermarkCore(
			() => this.requestUpdate(),
			imageUrl,
			options
		);
	}

	public override attached(param: PaneAttachedParameter<Time>): void {
		super.attached(param);
		this._core.attach();
	}

	public override detached(): void {
		this._core.detach();
		super.detached();
	}

	public updateAllViews(): void {
		this._core.updateAllViews();
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._core.paneViews();
	}

	/** The current options, with every default filled in. */
	public options(): Readonly<ImageWatermarkPluginOptions> {
		return this._core.options();
	}

	/** Changes any subset of the options. An option left out is not changed. */
	public applyOptions(options: ImageWatermarkPluginOptions): void {
		this._core.applyOptions(options);
	}

	/** Replaces the image. Shorthand for `applyOptions({ imageUrl })`. */
	public setImage(imageUrl: string): void {
		this._core.applyOptions({ imageUrl });
	}
}
