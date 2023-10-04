import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	IChartApi,
	ISeriesPrimitive,
	ISeriesPrimitivePaneRenderer,
	ISeriesPrimitivePaneView,
	SeriesAttachedParameter,
	SeriesPrimitivePaneViewZOrder,
	Time,
} from 'lightweight-charts';

export interface ImageWatermarkOptions {
	maxWidth?: number;
	maxHeight?: number;
	padding?: number;
	alpha?: number;
}

class ImageWatermarkPaneRenderer implements ISeriesPrimitivePaneRenderer {
	_source: ImageWatermark;
	_view: ImageWatermarkPaneView;

	constructor(source: ImageWatermark, view: ImageWatermarkPaneView) {
		this._source = source;
		this._view = view;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useMediaCoordinateSpace(scope => {
			const ctx = scope.context;
			const pos = this._view._placement;
			if (!pos) return;
			if (!this._source._imgElement) throw new Error(`Image element missing.`);
			ctx.globalAlpha = this._source._options.alpha ?? 1;
			ctx.drawImage(
				this._source._imgElement,
				pos.x,
				pos.y,
				pos.width,
				pos.height
			);
		});
	}
}

interface Placement {
	x: number;
	y: number;
	height: number;
	width: number;
}

class ImageWatermarkPaneView implements ISeriesPrimitivePaneView {
	_source: ImageWatermark;
	_placement: Placement | null = null;

	constructor(source: ImageWatermark) {
		this._source = source;
	}

	zOrder(): SeriesPrimitivePaneViewZOrder {
		return 'bottom';
	}

	update() {
		this._placement = this._determinePlacement();
	}

	renderer() {
		return new ImageWatermarkPaneRenderer(this._source, this);
	}

	private _determinePlacement(): Placement | null {
		if (!this._source._chart) return null;
		const leftPriceScaleWidth = this._source._chart.priceScale('left').width();
		const plotAreaWidth = this._source._chart.timeScale().width();
		const startX = leftPriceScaleWidth;
		const plotAreaHeight =
			this._source._chart.chartElement().clientHeight -
			this._source._chart.timeScale().height();

		const plotCentreX = Math.round(plotAreaWidth / 2) + startX;
		const plotCentreY = Math.round(plotAreaHeight / 2) + 0;

		const padding = this._source._options.padding ?? 0;
		let availableWidth = plotAreaWidth - 2 * padding;
		let availableHeight = plotAreaHeight - 2 * padding;

		if (this._source._options.maxHeight)
			availableHeight = Math.min(
				availableHeight,
				this._source._options.maxHeight
			);
		if (this._source._options.maxWidth)
			availableWidth = Math.min(availableWidth, this._source._options.maxWidth);

		const scaleX = availableWidth / this._source._imageWidth;
		const scaleY = availableHeight / this._source._imageHeight;
		const scaleToUse = Math.min(scaleX, scaleY);

		const drawWidth = this._source._imageWidth * scaleToUse;
		const drawHeight = this._source._imageHeight * scaleToUse;

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
	_paneViews: ImageWatermarkPaneView[];
	_imgElement: HTMLImageElement | null = null;
	_imageUrl: string;
	_options: ImageWatermarkOptions;
	_imageHeight = 0; // don't draw until loaded fully
	_imageWidth = 0;
	_chart: IChartApi | null = null;
	_containerElement: HTMLElement | null = null;
	_requestUpdate?: () => void;

	constructor(imageUrl: string, options: ImageWatermarkOptions) {
		this._imageUrl = imageUrl;
		this._options = options;
		this._paneViews = [new ImageWatermarkPaneView(this)];
	}

	attached({ chart, requestUpdate }: SeriesAttachedParameter<Time>) {
		this._chart = chart;
		this._requestUpdate = requestUpdate;
		this._containerElement = chart.chartElement();
		this._imgElement = new Image();
		this._imgElement.onload = () => {
			this._imageHeight = this._imgElement?.naturalHeight ?? 1;
			this._imageWidth = this._imgElement?.naturalWidth ?? 1;
			this._paneViews.forEach(pv => pv.update());
			this.requestUpdate();
		};
		this._imgElement.src = this._imageUrl;
	}

	detached() {
		this._imgElement = null;
	}

	requestUpdate(): void {
		if (this._requestUpdate) this._requestUpdate();
	}

	updateAllViews() {
		this._paneViews.forEach(pv => pv.update());
	}
	paneViews() {
		return this._paneViews;
	}
}
