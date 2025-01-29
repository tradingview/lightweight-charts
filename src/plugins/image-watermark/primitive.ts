import { IPaneApi } from '../../api/ipane-api';
import {
	IPanePrimitive,
	PaneAttachedParameter,
} from '../../api/ipane-primitive-api';

import { DeepPartial } from '../../helpers/strict-type-checks';

import { IPanePrimitivePaneView } from '../../model/ipane-primitive';

import { IPanePrimitiveWithOptions, IPanePrimitiveWrapper, PanePrimitiveWrapper } from '../pane-primitive-wrapper';
import { PrimitiveHasApplyOptions } from '../types';
import {
	ImageWatermarkOptions,
	imageWatermarkOptionsDefaults,
} from './options';
import { ImageWatermarkPaneView } from './pane-view';

function mergeOptionsWithDefaults(
	options: DeepPartial<ImageWatermarkOptions>
): ImageWatermarkOptions {
	return {
		...imageWatermarkOptionsDefaults,
		...options,
	};
}

class ImageWatermark<T> implements IPanePrimitive<T> {
	private _requestUpdate?: () => void;
	private _paneViews: ImageWatermarkPaneView<T>[];
	private _options: ImageWatermarkOptions;
	private _imgElement: HTMLImageElement | null = null;
	private _imageUrl: string;

	public constructor(
		imageUrl: string,
		options: DeepPartial<ImageWatermarkOptions>
	) {
		this._imageUrl = imageUrl;
		this._options = mergeOptionsWithDefaults(options);
		this._paneViews = [new ImageWatermarkPaneView(this._options)];
	}

	public updateAllViews(): void {
		this._paneViews.forEach((pw: ImageWatermarkPaneView<T>) => pw.update());
	}

	public paneViews(): readonly IPanePrimitivePaneView[] {
		return this._paneViews;
	}

	public attached(attachedParams: PaneAttachedParameter<T>): void {
		const { requestUpdate } = attachedParams;
		this._requestUpdate = requestUpdate;
		this._imgElement = new Image();
		this._imgElement.onload = () => {
			const imageHeight = this._imgElement?.naturalHeight ?? 1;
			const imageWidth = this._imgElement?.naturalWidth ?? 1;
			this._paneViews.forEach((pv: ImageWatermarkPaneView<T>) =>
				pv.stateUpdate({
					imageHeight,
					imageWidth,
					image: this._imgElement,
				})
			);
			if (this._requestUpdate) {
				this._requestUpdate();
			}
		};
		this._imgElement.src = this._imageUrl;
	}

	public detached(): void {
		this._requestUpdate = undefined;
		this._imgElement = null;
	}

	public applyOptions(options: DeepPartial<ImageWatermarkOptions>): void {
		this._options = mergeOptionsWithDefaults({ ...this._options, ...options });
		this._updateOptions();
		if (this.requestUpdate) {
			this.requestUpdate();
		}
	}

	public requestUpdate(): void {
		if (this._requestUpdate) {
			this._requestUpdate();
		}
	}

	private _updateOptions(): void {
		this._paneViews.forEach((pw: ImageWatermarkPaneView<T>) =>
			pw.optionsUpdate(this._options)
		);
	}
}

export type IImageWatermarkPluginApi<T> = PrimitiveHasApplyOptions<IPanePrimitiveWrapper<T, ImageWatermarkOptions>>;

/**
 * Creates an image watermark.
 *
 * @param pane - Target pane.
 * @param imageUrl - Image URL.
 * @param options - Watermark options.
 *
 * @returns Image watermark wrapper.
 *
 * @example
 * ```js
 * import { createImageWatermark } from 'lightweight-charts';
 *
 * const firstPane = chart.panes()[0];
 * const imageWatermark = createImageWatermark(firstPane, '/images/my-image.png', {
 *   alpha: 0.5,
 *   padding: 20,
 * });
 * // to change options
 * imageWatermark.applyOptions({ padding: 10 });
 * // to remove watermark from the pane
 * imageWatermark.detach();
 * ```
 */
export function createImageWatermark<T>(pane: IPaneApi<T>, imageUrl: string, options: DeepPartial<ImageWatermarkOptions>): IImageWatermarkPluginApi<T> {
	return new PanePrimitiveWrapper<T, ImageWatermarkOptions, IPanePrimitiveWithOptions<T, ImageWatermarkOptions>>(pane, new ImageWatermark(imageUrl, options));
}
