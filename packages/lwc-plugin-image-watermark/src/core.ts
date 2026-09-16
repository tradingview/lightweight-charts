import { IPrimitivePaneView } from 'lightweight-charts';

import { LoadedImage, imageCacheKey, loadImage } from './load-image.js';
import {
	ImageWatermarkPluginOptions,
	ResolvedOptions,
	mergeOptions,
	resolveOptions,
} from './options.js';
import { ImageWatermarkPaneView, WatermarkState } from './renderer.js';

/**
 * The watermark itself: options, image loading and the pane view. The two
 * public classes are thin lifecycle wrappers around it, one for a series and
 * one for a pane.
 */
export class ImageWatermarkCore {
	private readonly _requestUpdate: () => void;
	private readonly _paneViews: readonly ImageWatermarkPaneView[];
	private _options: ResolvedOptions;
	private _image: LoadedImage | null = null;
	private _imageKey: string | null = null;
	private _pendingKey: string | null = null;
	private _pendingLoad: AbortController | null = null;
	private _attached = false;

	public constructor(
		requestUpdate: () => void,
		imageUrl?: string,
		options?: ImageWatermarkPluginOptions
	) {
		this._requestUpdate = requestUpdate;
		this._options = resolveOptions(options);
		if (imageUrl !== undefined) {
			this._options.imageUrl = imageUrl;
		}
		this._paneViews = [new ImageWatermarkPaneView(this._state())];
	}

	public attach(): void {
		this._attached = true;
		this._ensureImage();
		this.updateAllViews();
	}

	public detach(): void {
		this._attached = false;
		this._cancelLoad();
		// A decoded image is kept: re-attaching reuses it instead of refetching.
	}

	public updateAllViews(): void {
		const state = this._state();
		this._paneViews.forEach(view => view.update(state));
	}

	public paneViews(): readonly IPrimitivePaneView[] {
		return this._paneViews;
	}

	public options(): Readonly<ImageWatermarkPluginOptions> {
		return { ...this._options };
	}

	public applyOptions(options: ImageWatermarkPluginOptions): void {
		const previousKey = this._sourceKey();
		this._options = mergeOptions(this._options, options);
		if (this._sourceKey() !== previousKey) {
			this._cancelLoad();
			this._image = null;
			this._imageKey = null;
			if (this._attached) {
				this._ensureImage();
			}
		}
		this.updateAllViews();
		this._requestUpdate();
	}

	private _sourceKey(): string {
		return imageCacheKey(this._options.imageUrl, this._options.crossOrigin);
	}

	private _ensureImage(): void {
		const url = this._options.imageUrl;
		if (url === '') {
			return;
		}
		const key = this._sourceKey();
		if (this._imageKey === key || this._pendingKey === key) {
			return;
		}
		this._cancelLoad();
		const controller = new AbortController();
		this._pendingLoad = controller;
		this._pendingKey = key;
		void loadImage(url, {
			signal: controller.signal,
			crossOrigin: this._options.crossOrigin,
		}).then(
			image => {
				if (controller.signal.aborted) {
					return;
				}
				this._clearPending();
				this._image = image;
				this._imageKey = key;
				this.updateAllViews();
				this._requestUpdate();
			},
			(error: unknown) => {
				if (controller.signal.aborted) {
					return;
				}
				this._clearPending();
				const onError = this._options.onError;
				if (onError) {
					onError(error, url);
				}
			}
		);
	}

	private _cancelLoad(): void {
		if (this._pendingLoad !== null) {
			this._pendingLoad.abort();
		}
		this._clearPending();
	}

	private _clearPending(): void {
		this._pendingLoad = null;
		this._pendingKey = null;
	}

	private _state(): WatermarkState {
		return {
			image: this._image === null ? null : this._image.element,
			imageWidth: this._image === null ? 0 : this._image.width,
			imageHeight: this._image === null ? 0 : this._image.height,
			options: this._options,
		};
	}
}
