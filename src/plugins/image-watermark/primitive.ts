import {
	IPanePrimitive,
	PaneAttachedParameter,
} from '../../api/ipane-primitive-api';

import { DeepPartial } from '../../helpers/strict-type-checks';

import { Time } from '../../model/horz-scale-behavior-time/types';
import { IPanePrimitivePaneView } from '../../model/ipane-primitive';

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

/**
 * A pane primitive for rendering a image watermark.
 *
 * @example
 * ```js
 * import { ImageWatermark } from 'lightweight-charts';
 *
 * const imageWatermark = new ImageWatermark('/images/my-image.png', {
 *   alpha: 0.5,
 *   padding: 20,
 * });
 *
 * const firstPane = chart.panes()[0];
 * firstPane.attachPrimitive(imageWatermark);
 * ```
 */
export class ImageWatermark<T = Time> implements IPanePrimitive<T> {
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
		const { requestUpdate, chart } = attachedParams;
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
					chart,
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
