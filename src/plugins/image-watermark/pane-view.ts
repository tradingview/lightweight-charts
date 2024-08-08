import {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from '../../model/ipane-primitive';

import { ImageWatermarkOptions } from './options';
import {
	ImageWatermarkRenderer,
	ImageWatermarkRendererOptions,
} from './pane-renderer';

interface ImageWatermarkPaneViewState {
	image: HTMLImageElement | null;
	imageWidth: number;
	imageHeight: number;
}

export class ImageWatermarkPaneView<T> implements IPrimitivePaneView {
	private _options: ImageWatermarkOptions;
	private _rendererOptions: ImageWatermarkRendererOptions;
	private _image: HTMLImageElement | null = null;
	private _imageWidth: number = 0; // don't draw until loaded
	private _imageHeight: number = 0;

	public constructor(options: ImageWatermarkOptions) {
		this._options = options;
		this._rendererOptions = buildRendererOptions(
			this._options,
			this._image,
			this._imageWidth,
			this._imageHeight
		);
	}

	public stateUpdate(state: ImageWatermarkPaneViewState): void {
		if (state.imageWidth !== undefined) {
			this._imageWidth = state.imageWidth;
		}
		if (state.imageHeight !== undefined) {
			this._imageHeight = state.imageHeight;
		}
		if (state.image !== undefined) {
			this._image = state.image;
		}
		this.update();
	}

	public optionsUpdate(options: ImageWatermarkOptions): void {
		this._options = options;
		this.update();
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return 'bottom' satisfies PrimitivePaneViewZOrder;
	}

	public update(): void {
		this._rendererOptions = buildRendererOptions(
			this._options,
			this._image,
			this._imageWidth,
			this._imageHeight
		);
	}

	public renderer(): IPrimitivePaneRenderer {
		return new ImageWatermarkRenderer(this._rendererOptions);
	}
}

function buildRendererOptions(
	options: ImageWatermarkOptions,
	imgElement: HTMLImageElement | null,
	imgWidth: number,
	imgHeight: number
): ImageWatermarkRendererOptions {
	return {
		...options,
		imgElement,
		imgWidth,
		imgHeight,
	};
}
