import { IChartApiBase } from '../../api/ichart-api';

import {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from '../../model/ipane-primitive';

import { ImageWatermarkOptions } from './options';
import {
	ImageWatermarkRenderer,
	ImageWatermarkRendererOptions,
	Placement,
} from './pane-renderer';

interface ImageWatermarkPaneViewState<T> {
	image: HTMLImageElement | null;
	imageWidth: number;
	imageHeight: number;
	chart: IChartApiBase<T> | null;
}

export class ImageWatermarkPaneView<T> implements IPrimitivePaneView {
	private _options: ImageWatermarkOptions;
	private _rendererOptions: ImageWatermarkRendererOptions;
	private _image: HTMLImageElement | null = null;
	private _imageWidth: number = 0; // don't draw until loaded
	private _imageHeight: number = 0;
	private _chart: IChartApiBase<T> | null = null;
	private _placement: Placement | null = null;

	public constructor(options: ImageWatermarkOptions) {
		this._options = options;
		this._rendererOptions = buildRendererOptions(
			this._options,
			this._placement,
			this._image
		);
	}

	public stateUpdate(state: ImageWatermarkPaneViewState<T>): void {
		if (state.chart !== undefined) {
			this._chart = state.chart;
		}
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
		this._placement = this._determinePlacement();
		this._rendererOptions = buildRendererOptions(
			this._options,
			this._placement,
			this._image
		);
	}

	public renderer(): IPrimitivePaneRenderer {
		return new ImageWatermarkRenderer(this._rendererOptions);
	}

	private _determinePlacement(): Placement | null {
		if (!this._chart || !this._imageWidth || !this._imageHeight) {
			return null;
		}
		const leftPriceScaleWidth = this._chart.priceScale('left').width();
		const plotAreaWidth = this._chart.timeScale().width();
		const startX = leftPriceScaleWidth;
		const plotAreaHeight =
			this._chart.chartElement().clientHeight -
			this._chart.timeScale().height();

		const plotCentreX = Math.round(plotAreaWidth / 2) + startX;
		const plotCentreY = Math.round(plotAreaHeight / 2) + 0;

		const padding = this._options.padding ?? 0;
		let availableWidth = plotAreaWidth - 2 * padding;
		let availableHeight = plotAreaHeight - 2 * padding;

		if (this._options.maxHeight) {
			availableHeight = Math.min(availableHeight, this._options.maxHeight);
		}
		if (this._options.maxWidth) {
			availableWidth = Math.min(availableWidth, this._options.maxWidth);
		}

		const scaleX = availableWidth / this._imageWidth;
		const scaleY = availableHeight / this._imageHeight;
		const scaleToUse = Math.min(scaleX, scaleY);

		const drawWidth = this._imageWidth * scaleToUse;
		const drawHeight = this._imageHeight * scaleToUse;

		const x = plotCentreX - 0.5 * drawWidth;
		const y = plotCentreY - 0.5 * drawHeight;

		return {
			x,
			y,
			height: drawHeight,
			width: drawWidth,
		};
	}
}

function buildRendererOptions(
	options: ImageWatermarkOptions,
	placement: Placement | null,
	imgElement: HTMLImageElement | null
): ImageWatermarkRendererOptions {
	return {
		...options,
		placement,
		imgElement,
	};
}
