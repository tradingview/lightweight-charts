import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	IChartApi,
	ISeriesPrimitive,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	SeriesAttachedParameter,
	PrimitivePaneViewZOrder,
	Time,
} from 'lightweight-charts';

export interface ImageWatermarkPluginOptions {
	maxWidth?: number;
	maxHeight?: number;
	padding?: number;
	alpha?: number;
}

/** @deprecated Use ImageWatermarkPluginOptions. */
export type ImageWatermarkOptions = ImageWatermarkPluginOptions;

/** The same options, with every value filled in. */
interface ResolvedOptions {
	maxWidth: number | undefined;
	maxHeight: number | undefined;
	padding: number;
	alpha: number;
}

const defaults: ResolvedOptions = {
	maxWidth: undefined,
	maxHeight: undefined,
	padding: 0,
	alpha: 1,
};

/** Values used for any option not passed to the constructor. */
export const defaultOptions: ImageWatermarkPluginOptions = defaults;

function resolveOptions(
	options: ImageWatermarkPluginOptions = {}
): ResolvedOptions {
	return {
		maxWidth: options.maxWidth ?? defaults.maxWidth,
		maxHeight: options.maxHeight ?? defaults.maxHeight,
		padding: options.padding ?? defaults.padding,
		alpha: options.alpha ?? defaults.alpha,
	};
}

interface Placement {
	x: number;
	y: number;
	height: number;
	width: number;
}

/** Everything a pane view needs from the watermark to place and draw the image. */
interface WatermarkState {
	chart: IChartApi | null;
	image: HTMLImageElement | null;
	imageWidth: number;
	imageHeight: number;
	options: ResolvedOptions;
}

class ImageWatermarkPaneRenderer implements IPrimitivePaneRenderer {
	private readonly _state: WatermarkState;
	private readonly _placement: Placement | null;

	public constructor(state: WatermarkState, placement: Placement | null) {
		this._state = state;
		this._placement = placement;
	}

	public draw(target: CanvasRenderingTarget2D) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			const pos = this._placement;
			if (!pos) return;
			const image = this._state.image;
			if (!image) return;
			ctx.globalAlpha = this._state.options.alpha;
			ctx.drawImage(image, pos.x, pos.y, pos.width, pos.height);
		});
	}
}

class ImageWatermarkPaneView implements IPrimitivePaneView {
	private _state: WatermarkState;
	private _placement: Placement | null = null;

	public constructor(state: WatermarkState) {
		this._state = state;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return 'bottom';
	}

	public update(state: WatermarkState) {
		this._state = state;
		this._placement = this._determinePlacement();
	}

	public renderer() {
		return new ImageWatermarkPaneRenderer(this._state, this._placement);
	}

	private _determinePlacement(): Placement | null {
		const chart = this._state.chart;
		if (!chart) return null;
		const leftPriceScaleWidth = chart.priceScale('left').width();
		const plotAreaWidth = chart.timeScale().width();
		const startX = leftPriceScaleWidth;
		const plotAreaHeight =
			chart.chartElement().clientHeight - chart.timeScale().height();

		const plotCentreX = Math.round(plotAreaWidth / 2) + startX;
		const plotCentreY = Math.round(plotAreaHeight / 2) + 0;

		const options = this._state.options;
		const padding = options.padding;
		let availableWidth = plotAreaWidth - 2 * padding;
		let availableHeight = plotAreaHeight - 2 * padding;

		if (options.maxHeight)
			availableHeight = Math.min(availableHeight, options.maxHeight);
		if (options.maxWidth)
			availableWidth = Math.min(availableWidth, options.maxWidth);

		const scaleX = availableWidth / this._state.imageWidth;
		const scaleY = availableHeight / this._state.imageHeight;
		const scaleToUse = Math.min(scaleX, scaleY);

		const drawWidth = this._state.imageWidth * scaleToUse;
		const drawHeight = this._state.imageHeight * scaleToUse;

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

export class ImageWatermark implements ISeriesPrimitive<Time> {
	private readonly _paneViews: ImageWatermarkPaneView[];
	private readonly _imageUrl: string;
	private readonly _options: ResolvedOptions;
	private _imgElement: HTMLImageElement | null = null;
	private _imageHeight = 0; // don't draw until loaded fully
	private _imageWidth = 0;
	private _chart: IChartApi | null = null;
	private _requestUpdate?: () => void;

	public constructor(imageUrl: string, options?: ImageWatermarkPluginOptions) {
		this._imageUrl = imageUrl;
		this._options = resolveOptions(options);
		this._paneViews = [new ImageWatermarkPaneView(this._state())];
	}

	public attached({ chart, requestUpdate }: SeriesAttachedParameter<Time>) {
		this._chart = chart;
		this._requestUpdate = requestUpdate;
		const loaded = this._imgElement;
		// An image decoded before an earlier detach is reused instead of refetched.
		if (loaded && loaded.complete && loaded.naturalWidth > 0) {
			this.updateAllViews();
			this._fireRequestUpdate();
			return;
		}
		const img = new Image();
		this._imgElement = img;
		img.onload = () => {
			if (this._imgElement !== img) return;
			this._imageHeight = img.naturalHeight;
			this._imageWidth = img.naturalWidth;
			this.updateAllViews();
			this._fireRequestUpdate();
		};
		img.onerror = () => {
			if (this._imgElement !== img) return;
			this._imgElement = null;
		};
		img.src = this._imageUrl;
	}

	public detached() {
		const img = this._imgElement;
		if (img) {
			img.onload = img.onerror = null;
			// A load still in flight is abandoned: nothing of it is kept.
			if (!img.complete || img.naturalWidth === 0) this._imgElement = null;
		}
		this._chart = null;
		this._requestUpdate = undefined;
	}

	public updateAllViews() {
		const state = this._state();
		this._paneViews.forEach(pv => pv.update(state));
	}

	public paneViews(): IPrimitivePaneView[] {
		return this._paneViews;
	}

	private _state(): WatermarkState {
		return {
			chart: this._chart,
			image: this._imgElement,
			imageWidth: this._imageWidth,
			imageHeight: this._imageHeight,
			options: this._options,
		};
	}

	private _fireRequestUpdate(): void {
		if (this._requestUpdate) this._requestUpdate();
	}
}
