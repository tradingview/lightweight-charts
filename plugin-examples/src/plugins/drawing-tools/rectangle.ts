import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	IChartApi,
	ISeriesApi,
	SeriesType,
	MouseEventParams,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	ISeriesPrimitiveAxisView,
	PrimitivePaneViewZOrder,
	Coordinate,
	PrimitiveHoveredItem
} from 'lightweight-charts';
import { ensureDefined } from '../../helpers/assertions';
import { positionsBox } from '../../helpers/dimensions/positions';
import { PluginBase } from '../plugin-base';
import { Point, ViewPoint } from './types';
import { ShapeIdGenerator } from './drawing-tools';
import { IShape, IPreviewShape, IDrawingTool } from './interfaces';
import { defaultRectangleOptions, RectangleDrawingToolOptions } from './options';

class RectanglePaneRenderer implements IPrimitivePaneRenderer {
	_p1: ViewPoint;
	_p2: ViewPoint;
	_fillColor: string;

	constructor(p1: ViewPoint, p2: ViewPoint, fillColor: string) {
		this._p1 = p1;
		this._p2 = p2;
		this._fillColor = fillColor;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (
				this._p1.x === null ||
				this._p1.y === null ||
				this._p2.x === null ||
				this._p2.y === null
			)
				return;
			const ctx = scope.context;
			const horizontalPositions = positionsBox(
				this._p1.x,
				this._p2.x,
				scope.horizontalPixelRatio
			);
			const verticalPositions = positionsBox(
				this._p1.y,
				this._p2.y,
				scope.verticalPixelRatio
			);
			ctx.fillStyle = this._fillColor;
			ctx.fillRect(
				horizontalPositions.position,
				verticalPositions.position,
				horizontalPositions.length,
				verticalPositions.length
			);
		});
	}
}

class RectangleAxisPaneRenderer implements IPrimitivePaneRenderer {
	_p1: number | null;
	_p2: number | null;
	_fillColor: string;
	_vertical: boolean = false;

	constructor(
		p1: number | null,
		p2: number | null,
		fillColor: string,
		vertical: boolean
	) {
		this._p1 = p1;
		this._p2 = p2;
		this._fillColor = fillColor;
		this._vertical = vertical;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (this._p1 === null || this._p2 === null) return;
			const ctx = scope.context;
			ctx.globalAlpha = 0.5;
			const positions = positionsBox(
				this._p1,
				this._p2,
				this._vertical ? scope.verticalPixelRatio : scope.horizontalPixelRatio
			);
			ctx.fillStyle = this._fillColor;
			if (this._vertical) {
				ctx.fillRect(0, positions.position, 15, positions.length);
			} else {
				ctx.fillRect(positions.position, 0, positions.length, 15);
			}
		});
	}
}

class RectanglePaneView implements IPrimitivePaneView {
	_source: Rectangle;
	_p1: ViewPoint = { x: null, y: null };
	_p2: ViewPoint = { x: null, y: null };

	constructor(source: Rectangle) {
		this._source = source;
	}

	update() {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source._p1.price);
		const y2 = series.priceToCoordinate(this._source._p2.price);
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source._p1.time);
		const x2 = timeScale.timeToCoordinate(this._source._p2.time);
		this._p1 = { x: x1, y: y1 };
		this._p2 = { x: x2, y: y2 };
	}

	renderer() {
		return new RectanglePaneRenderer(
			this._p1,
			this._p2,
			this._source._options.fillColor
		);
	}
}

abstract class RectangleAxisPaneView implements IPrimitivePaneView {
	_source: Rectangle;
	_p1: number | null = null;
	_p2: number | null = null;
	_vertical: boolean = false;

	constructor(source: Rectangle, vertical: boolean) {
		this._source = source;
		this._vertical = vertical;
	}

	abstract getPoints(): [Coordinate | null, Coordinate | null];

	update() {
		[this._p1, this._p2] = this.getPoints();
	}

	renderer() {
		return new RectangleAxisPaneRenderer(
			this._p1,
			this._p2,
			this._source._options.fillColor,
			this._vertical
		);
	}
	zOrder(): PrimitivePaneViewZOrder {
		return 'bottom';
	}
}

class RectanglePriceAxisPaneView extends RectangleAxisPaneView {
	getPoints(): [Coordinate | null, Coordinate | null] {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source._p1.price);
		const y2 = series.priceToCoordinate(this._source._p2.price);
		return [y1, y2];
	}
}

class RectangleTimeAxisPaneView extends RectangleAxisPaneView {
	getPoints(): [Coordinate | null, Coordinate | null] {
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source._p1.time);
		const x2 = timeScale.timeToCoordinate(this._source._p2.time);
		return [x1, x2];
	}
}

abstract class RectangleAxisView implements ISeriesPrimitiveAxisView {
	_source: Rectangle;
	_p: Point;
	_pos: Coordinate | null = null;
	constructor(source: Rectangle, p: Point) {
		this._source = source;
		this._p = p;
	}
	abstract update(): void;
	abstract text(): string;

	coordinate() {
		return this._pos ?? -1;
	}

	visible(): boolean {
		return this._source._options.showLabels;
	}

	tickVisible(): boolean {
		return this._source._options.showLabels;
	}

	textColor() {
		return this._source._options.labelTextColor;
	}
	backColor() {
		return this._source._options.labelColor;
	}
	movePoint(p: Point) {
		this._p = p;
		this.update();
	}
}

class RectangleTimeAxisView extends RectangleAxisView {
	update() {
		const timeScale = this._source.chart.timeScale();
		this._pos = timeScale.timeToCoordinate(this._p.time);
	}
	text() {
		return this._source._options.timeLabelFormatter(this._p.time);
	}
}

class RectanglePriceAxisView extends RectangleAxisView {
	update() {
		const series = this._source.series;
		this._pos = series.priceToCoordinate(this._p.price);
	}
	text() {
		return this._source._options.priceLabelFormatter(this._p.price);
	}
}

export class Rectangle extends PluginBase implements IShape {
	_id: string;
	_options: RectangleDrawingToolOptions;
	_p1: Point;
	_p2: Point;
	_paneViews: RectanglePaneView[];
	_timeAxisViews: RectangleTimeAxisView[];
	_priceAxisViews: RectanglePriceAxisView[];
	_priceAxisPaneViews: RectanglePriceAxisPaneView[];
	_timeAxisPaneViews: RectangleTimeAxisPaneView[];

	constructor(
		p1: Point,
		p2: Point,
		options: Partial<RectangleDrawingToolOptions> = {}
	) {
		super();
		this._id = ShapeIdGenerator.getNextId();
		this._p1 = p1;
		this._p2 = p2;
		this._options = {
			...defaultRectangleOptions,
			...options,
		};
		this._paneViews = [new RectanglePaneView(this)];
		this._timeAxisViews = [
			new RectangleTimeAxisView(this, p1),
			new RectangleTimeAxisView(this, p2),
		];
		this._priceAxisViews = [
			new RectanglePriceAxisView(this, p1),
			new RectanglePriceAxisView(this, p2),
		];
		this._priceAxisPaneViews = [new RectanglePriceAxisPaneView(this, true)];
		this._timeAxisPaneViews = [new RectangleTimeAxisPaneView(this, false)];
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
		this._timeAxisViews.forEach(pw => pw.update());
		this._priceAxisViews.forEach(pw => pw.update());
		this._priceAxisPaneViews.forEach(pw => pw.update());
		this._timeAxisPaneViews.forEach(pw => pw.update());
	}

	priceAxisViews() {
		return this._priceAxisViews;
	}

	timeAxisViews() {
		return this._timeAxisViews;
	}

	paneViews() {
		return this._paneViews;
	}

	priceAxisPaneViews() {
		return this._priceAxisPaneViews;
	}

	timeAxisPaneViews() {
		return this._timeAxisPaneViews;
	}

	applyOptions(options: Partial<RectangleDrawingToolOptions>) {
		this._options = { ...this._options, ...options };
		this.requestUpdate();
	}

	public hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null {
		if (!this._paneViews || !this._paneViews[0]) {
			return null;
		}
		const p1View = this._paneViews[0]._p1;
		const p2View = this._paneViews[0]._p2;

		if (p1View.x === null || p1View.y === null || p2View.x === null || p2View.y === null) {
			return null;
		}

		const minX = Math.min(p1View.x, p2View.x);
		const maxX = Math.max(p1View.x, p2View.x);
		const minY = Math.min(p1View.y, p2View.y);
		const maxY = Math.max(p1View.y, p2View.y);

		if (x >= minX && x <= maxX && y >= minY && y <= maxY) {
			return {
				externalId: this._id,
				zOrder: 'normal',
				cursorStyle: 'pointer',
			};
		}
		return null;
	}
}

export class PreviewRectangle extends Rectangle implements IPreviewShape {
	constructor(
		p1: Point,
		p2: Point,
		options: Partial<RectangleDrawingToolOptions> = {}
	) {
		super(p1, p2, options);
		this._options.fillColor = this._options.previewFillColor;
	}

	public updateEndPoint(p: Point) {
		this._p2 = p;
		this._paneViews[0].update();
		this._timeAxisViews[1].movePoint(p);
		this._priceAxisViews[1].movePoint(p);
		this.requestUpdate();
	}
}

export class RectangleDrawingTool implements IDrawingTool {
	_chart: IChartApi;
	_series: ISeriesApi<SeriesType>;
	_defaultOptions: Partial<RectangleDrawingToolOptions>;
	private _rectangles: Rectangle[];
	private _previewRectangle: PreviewRectangle | undefined = undefined;
	_points: Point[] = [];
	_drawing: boolean = false;
	_onDrawingCompleteCallback?: () => void;

	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		options: Partial<RectangleDrawingToolOptions>,
		onDrawingCompleteCallback?: () => void
	) {
		this._chart = chart;
		this._series = series;
		this._defaultOptions = options;
		this._onDrawingCompleteCallback = onDrawingCompleteCallback;
		this._rectangles = [];
		this._chart.subscribeClick(this._clickHandler);
		this._chart.subscribeCrosshairMove(this._moveHandler);
		this._chart.subscribeDblClick(this._dblClickHandler);
	}

	_clickHandler = (param: MouseEventParams) => this._onClick(param);
	_moveHandler = (param: MouseEventParams) => this._onMouseMove(param);
	_dblClickHandler = (param: MouseEventParams) => this._onDblClick(param);

	public get options(): Partial<RectangleDrawingToolOptions> {
		return this._defaultOptions;
	}

	remove() {
		this._rectangles.forEach(rect => this._removeRectangle(rect));
		this.stopDrawing();
		this._chart.unsubscribeClick(this._clickHandler);
		this._chart.unsubscribeCrosshairMove(this._moveHandler);
		this._rectangles.forEach(rectangle => {
			this._removeRectangle(rectangle);
		});
		this._rectangles = [];
		this._removePreviewRectangle();
		this._chart.unsubscribeDblClick(this._dblClickHandler);
	}

	startDrawing(): void {
		this._drawing = true;
		this._points = [];
	}

	stopDrawing(): void {
		this._drawing = false;
		this._points = [];
		this._removePreviewRectangle();
	}

	isDrawing(): boolean {
		return this._drawing;
	}

	_onClick(param: MouseEventParams) {
		if (!this._drawing || !param.point || !param.time || !this._series) return;
		const price = this._series.coordinateToPrice(param.point.y);
		if (price === null) {
			return;
		}
		this._addPoint({
			time: param.time,
			price,
		});
	}

	_onMouseMove(param: MouseEventParams) {
		if (!this._drawing || !param.point || !param.time || !this._series) return;
		const price = this._series.coordinateToPrice(param.point.y);
		if (price === null) {
			return;
		}
		if (this._previewRectangle) {
			this._previewRectangle.updateEndPoint({
				time: param.time,
				price,
			});
		}
	}

	_onDblClick(param: MouseEventParams) {
		if (this._drawing) return;

		const hoveredId = param.hoveredObjectId as string | undefined;
		if (!hoveredId) return;

		const rectIndex = this._rectangles.findIndex(rect => rect._id === hoveredId);
		if (rectIndex !== -1) {
			const rectToRemove = this._rectangles[rectIndex];
			this._removeRectangle(rectToRemove);
			this._rectangles.splice(rectIndex, 1);
		}
	}

	_addPoint(p: Point) {
		this._points.push(p);
		if (this._points.length >= 2) {
			this._addNewRectangle(this._points[0], this._points[1]);
			this.stopDrawing(); 
			if (this._onDrawingCompleteCallback) {
				this._onDrawingCompleteCallback();
			}
		}
		if (this._points.length === 1) {
			this._addPreviewRectangle(this._points[0]);
		}
	}

	private _addNewRectangle(p1: Point, p2: Point) {
		const rectangle = new Rectangle(p1, p2, { ...this._defaultOptions });
		this._rectangles.push(rectangle);
		ensureDefined(this._series).attachPrimitive(rectangle);
	}

	private _removeRectangle(rectangle: Rectangle) {
		ensureDefined(this._series).detachPrimitive(rectangle);
	}

	private _addPreviewRectangle(p: Point) {
		this._previewRectangle = new PreviewRectangle(p, p, {
			...this._defaultOptions,
		});
		ensureDefined(this._series).attachPrimitive(this._previewRectangle);
	}

	private _removePreviewRectangle() {
		if (this._previewRectangle) {
			ensureDefined(this._series).detachPrimitive(this._previewRectangle);
			this._previewRectangle = undefined;
		}
	}
}	