import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	Coordinate,
	IChartApi,
	isBusinessDay,
	ISeriesApi,
	ISeriesPrimitiveAxisView,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	MouseEventParams,
	PrimitivePaneViewZOrder,
	SeriesType,
	Time,
} from 'lightweight-charts';
import { ensureDefined } from '../../helpers/assertions';
import { PluginBase } from '../plugin-base';
import { positionsBox } from '../../helpers/dimensions/positions';

class ShapeIdGenerator {
	private static _nextId = 0;
	public static getNextId(): string {
		return `${ShapeIdGenerator._nextId++}`;
	}
}

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

class LinePaneRenderer implements IPrimitivePaneRenderer {
	_p1: ViewPoint;
	_p2: ViewPoint;
	_lineColor: string;
	_lineWidth: number;

	constructor(p1: ViewPoint, p2: ViewPoint, lineColor: string, lineWidth: number) {
		this._p1 = p1;
		this._p2 = p2;
		this._lineColor = lineColor;
		this._lineWidth = lineWidth;
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
			
			const x1 = this._p1.x * scope.horizontalPixelRatio;
			const y1 = this._p1.y * scope.verticalPixelRatio;
			const x2 = this._p2.x * scope.horizontalPixelRatio;
			const y2 = this._p2.y * scope.verticalPixelRatio;

			ctx.strokeStyle = this._lineColor;
			ctx.lineWidth = this._lineWidth * scope.horizontalPixelRatio;
			ctx.lineCap = 'round';
			ctx.lineJoin = 'round';
			
			ctx.beginPath();
			ctx.moveTo(x1, y1);
			ctx.lineTo(x2, y2);
			ctx.stroke();
		});
	}
}

interface ViewPoint {
	x: Coordinate | null;
	y: Coordinate | null;
}

class LinePaneView implements IPrimitivePaneView {
	_source: Line;
	_p1: ViewPoint = { x: null, y: null };
	_p2: ViewPoint = { x: null, y: null };

	constructor(source: Line) {
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
		return new LinePaneRenderer(
			this._p1,
			this._p2,
			this._source._options.lineColor,
			this._source._options.lineWidth
		);
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

abstract class LineAxisView implements ISeriesPrimitiveAxisView {
	_source: Line;
	_p: Point;
	_pos: Coordinate | null = null;
	constructor(source: Line, p: Point) {
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

class LineTimeAxisView extends LineAxisView {
	update() {
		const timeScale = this._source.chart.timeScale();
		this._pos = timeScale.timeToCoordinate(this._p.time);
	}
	text() {
		return this._source._options.timeLabelFormatter(this._p.time);
	}
}

class LinePriceAxisView extends LineAxisView {
	update() {
		const series = this._source.series;
		this._pos = series.priceToCoordinate(this._p.price);
	}
	text() {
		return this._source._options.priceLabelFormatter(this._p.price);
	}
}

interface Point {
	time: Time;
	price: number;
}

export interface RectangleDrawingToolOptions {
	fillColor: string;
	previewFillColor: string;
	labelColor: string;
	labelTextColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
}

export interface LineDrawingToolOptions {
	lineColor: string;
	previewLineColor: string;
	lineWidth: number;
	labelColor: string;
	labelTextColor: string;
	showLabels: boolean;
	priceLabelFormatter: (price: number) => string;
	timeLabelFormatter: (time: Time) => string;
}

const defaultRectangleOptions: RectangleDrawingToolOptions = {
	fillColor: 'rgba(200, 50, 100, 0.35)',
	previewFillColor: 'rgba(200, 50, 100, 0.25)',
	labelColor: 'rgba(200, 50, 100, 1)',
	labelTextColor: 'white',
	showLabels: true,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time == 'string') return time;
		const date = isBusinessDay(time)
			? new Date(time.year, time.month, time.day)
			: new Date(time * 1000);
		return date.toLocaleDateString();
	},
};

const defaultLineOptions: LineDrawingToolOptions = {
	lineColor: 'rgba(0 , 0, 0, 1)',
	previewLineColor: 'rgba(0, 0, 0, 0.5)',
	lineWidth: 2,
	labelColor: 'rgba(0, 0, 0, 1)',
	labelTextColor: 'white',
	showLabels: true,
	priceLabelFormatter: (price: number) => price.toFixed(2),
	timeLabelFormatter: (time: Time) => {
		if (typeof time == 'string') return time;
		const date = isBusinessDay(time)
			? new Date(time.year, time.month, time.day)
			: new Date(time * 1000);
		return date.toLocaleDateString();
	},
};

interface PrimitiveHoveredItem {
	externalId: string;
	zOrder: PrimitivePaneViewZOrder;
	cursorStyle: string;
}

class Line extends PluginBase {
	_id: string;
	_options: LineDrawingToolOptions;
	_p1: Point;
	_p2: Point;
	_paneViews: LinePaneView[];
	_timeAxisViews: LineTimeAxisView[];
	_priceAxisViews: LinePriceAxisView[];

	constructor(
		p1: Point,
		p2: Point,
		options: Partial<LineDrawingToolOptions> = {}
	) {
		super();
		this._id = ShapeIdGenerator.getNextId();
		this._p1 = p1;
		this._p2 = p2;
		this._options = {
			...defaultLineOptions,
			...options,
		};
		this._paneViews = [new LinePaneView(this)];
		this._timeAxisViews = [
			new LineTimeAxisView(this, p1),
			new LineTimeAxisView(this, p2),
		];
		this._priceAxisViews = [
			new LinePriceAxisView(this, p1),
			new LinePriceAxisView(this, p2),
		];
	}

	updateAllViews() {
		this._paneViews.forEach(pw => pw.update());
		this._timeAxisViews.forEach(pw => pw.update());
		this._priceAxisViews.forEach(pw => pw.update());
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

	applyOptions(options: Partial<LineDrawingToolOptions>) {
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

		const point = { x, y };

		const distSqToSegment = (p: ViewPoint, v: ViewPoint, w: ViewPoint): number => {
			if (p.x === null || p.y === null || v.x === null || v.y === null || w.x === null || w.y === null) {
				return Infinity;
			}
			const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
			if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
			let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
			t = Math.max(0, Math.min(1, t));
			const projX = v.x + t * (w.x - v.x);
			const projY = v.y + t * (w.y - v.y);
			return (p.x - projX) ** 2 + (p.y - projY) ** 2;
		};

		const distanceSq = distSqToSegment(point, p1View, p2View);
		const tolerance = (this._options.lineWidth / 2) + 2;
		if (distanceSq <= tolerance * tolerance) {
			return {
				externalId: this._id,
				zOrder: 'normal',
				cursorStyle: 'pointer',
			};
		}
		return null;
	}
}

class PreviewLine extends Line {
	constructor(
		p1: Point,
		p2: Point,
		options: Partial<LineDrawingToolOptions> = {}
	) {
		super(p1, p2, options);
		this._options.lineColor = this._options.previewLineColor;
	}

	public updateEndPoint(p: Point) {
		this._p2 = p;
		this._paneViews[0].update();
		this._timeAxisViews[1].movePoint(p);
		this._priceAxisViews[1].movePoint(p);
		this.requestUpdate();
	}
}

class Rectangle extends PluginBase {
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

class PreviewRectangle extends Rectangle {
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

export class LineDrawingTool {
	private _chart: IChartApi;
	private _series: ISeriesApi<SeriesType>;
	private _defaultOptions: Partial<LineDrawingToolOptions>;
	private _lines: Line[];
	private _previewLine: PreviewLine | undefined = undefined;
	private _points: Point[] = [];
	private _drawing: boolean = false;
	private _onDrawingCompleteCallback?: () => void;

	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		options: Partial<LineDrawingToolOptions>,
		onDrawingCompleteCallback?: () => void
	) {
		this._chart = chart;
		this._series = series;
		this._defaultOptions = options;
		this._onDrawingCompleteCallback = onDrawingCompleteCallback;
		this._lines = [];
		this._chart.subscribeClick(this._clickHandler);
		this._chart.subscribeCrosshairMove(this._moveHandler);
		this._chart.subscribeDblClick(this._dblClickHandler);
	}

	private _clickHandler = (param: MouseEventParams) => this._onClick(param);
	private _moveHandler = (param: MouseEventParams) => this._onMouseMove(param);
	private _dblClickHandler = (param: MouseEventParams) => this._onDblClick(param);

	public get options(): Partial<LineDrawingToolOptions> {
		return this._defaultOptions;
	}

	remove() {
		this._lines.forEach(line => this._removeLine(line));
		this.stopDrawing();
		this._chart.unsubscribeClick(this._clickHandler);
		this._chart.unsubscribeCrosshairMove(this._moveHandler);
		this._lines.forEach(line => {
			this._removeLine(line);
		});
		this._lines = [];
		this._removePreviewLine();
		this._chart.unsubscribeDblClick(this._dblClickHandler);
	}

	startDrawing(): void {
		this._drawing = true;
		this._points = [];
	}

	stopDrawing(): void {
		this._drawing = false;
		this._points = [];
        this._removePreviewLine();
	}

	isDrawing(): boolean {
		return this._drawing;
	}

	private _onClick(param: MouseEventParams) {
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

	private _onMouseMove(param: MouseEventParams) {
		if (!this._drawing || !param.point || !param.time || !this._series) return;
		const price = this._series.coordinateToPrice(param.point.y);
		if (price === null) {
			return;
		}
		if (this._previewLine) {
			this._previewLine.updateEndPoint({
				time: param.time,
				price,
			});
		}
	}

	private _onDblClick(param: MouseEventParams) {
		if (this._drawing) return;

		const hoveredId = param.hoveredObjectId as string | undefined;
		if (!hoveredId) return;

		const lineIndex = this._lines.findIndex(line => line._id === hoveredId);
		if (lineIndex !== -1) {
			const lineToRemove = this._lines[lineIndex];
			this._removeLine(lineToRemove);
			this._lines.splice(lineIndex, 1);
		}
	}

	private _addPoint(p: Point) {
		this._points.push(p);
		if (this._points.length >= 2) {
			this._addNewLine(this._points[0], this._points[1]);
			this.stopDrawing(); 
			if (this._onDrawingCompleteCallback) {
				this._onDrawingCompleteCallback();
			}
		}
		if (this._points.length === 1) {
			this._addPreviewLine(this._points[0]);
		}
	}

	private _addNewLine(p1: Point, p2: Point) {
		const line = new Line(p1, p2, { ...this._defaultOptions });
		this._lines.push(line);
		ensureDefined(this._series).attachPrimitive(line);
	}

	private _removeLine(line: Line) {
		ensureDefined(this._series).detachPrimitive(line);
	}

	private _addPreviewLine(p: Point) {
		this._previewLine = new PreviewLine(p, p, {
			...this._defaultOptions,
		});
		ensureDefined(this._series).attachPrimitive(this._previewLine);
	}

	private _removePreviewLine() {
		if (this._previewLine) {
			ensureDefined(this._series).detachPrimitive(this._previewLine);
			this._previewLine = undefined;
		}
	}
}

export class RectangleDrawingTool {
	private _chart: IChartApi;
	private _series: ISeriesApi<SeriesType>;
	private _defaultOptions: Partial<RectangleDrawingToolOptions>;
	private _rectangles: Rectangle[];
	private _previewRectangle: PreviewRectangle | undefined = undefined;
	private _points: Point[] = [];
	private _drawing: boolean = false;
	private _onDrawingCompleteCallback?: () => void;

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

	private _clickHandler = (param: MouseEventParams) => this._onClick(param);
	private _moveHandler = (param: MouseEventParams) => this._onMouseMove(param);
	private _dblClickHandler = (param: MouseEventParams) => this._onDblClick(param);

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

	private _onClick(param: MouseEventParams) {
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

	private _onMouseMove(param: MouseEventParams) {
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

	private _onDblClick(param: MouseEventParams) {
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

	private _addPoint(p: Point) {
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

export class DrawingTools {
	private _rectangleTool: RectangleDrawingTool;
	private _lineTool: LineDrawingTool;
	private _currentTool: 'rectangle' | 'line' | null = null;
    private _drawingsToolbarContainer: HTMLDivElement;
    private _rectangleButton: HTMLDivElement | undefined;
    private _lineButton: HTMLDivElement | undefined;

    private _activeButtonColor: string = '#000000'; 
    private readonly _inactiveColor = 'rgb(100, 100, 100)';

	private _selectedBaseColor: string = '#000000'; 
	private _currentOpacity: number = 0.35; 
	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		drawingsToolbarContainer: HTMLDivElement,
		rectangleOptions: Partial<RectangleDrawingToolOptions> = {},
		lineOptions: Partial<LineDrawingToolOptions> = {}
	) {
        this._drawingsToolbarContainer = drawingsToolbarContainer;
		this._rectangleTool = new RectangleDrawingTool(
			chart,
			series,
			rectangleOptions,
			this.stopDrawing.bind(this)
		);
		this._lineTool = new LineDrawingTool(
			chart,
			series,
			lineOptions,
			this.stopDrawing.bind(this)
		);

        this._selectedBaseColor = '#000000'; 
        this._currentOpacity = 0.35;
        this._activeButtonColor = this._selectedBaseColor; 

        this._createToolbar();
        this._updateDrawingToolColorsAndOpacity();
	}

    private _createToolbar() {
        const lineButton = document.createElement('div');
		lineButton.style.width = '24px';
		lineButton.style.height = '24px';
        lineButton.style.cursor = 'pointer';
        lineButton.style.fill = this._inactiveColor;
		lineButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.71,3.29a1,1,0,0,0-1.42,0L3.29,20.29a1,1,0,0,0,0,1.42,1,1,0,0,0,1.42,0L21.71,4.71A1,1,0,0,0,21.71,3.29Z"/></svg>`;
		lineButton.addEventListener('click', () => this.selectLineTool());
		this._drawingsToolbarContainer.appendChild(lineButton);
        this._lineButton = lineButton;

        const rectButton = document.createElement('div');
		rectButton.style.width = '24px';
		rectButton.style.height = '24px';
        rectButton.style.cursor = 'pointer';
        rectButton.style.fill = this._inactiveColor;
		rectButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 2v20h20V2H2zm18 18H4V4h16v16z"/></svg>`;
		rectButton.addEventListener('click', () => this.selectRectangleTool());
        this._drawingsToolbarContainer.appendChild(rectButton);
		this._rectangleButton = rectButton;

		const colorPicker = document.createElement('input');
		colorPicker.type = 'color';
		colorPicker.value = this._selectedBaseColor;
		colorPicker.style.width = '24px';
		colorPicker.style.height = '24px';
		colorPicker.style.border = 'none';
		colorPicker.style.padding = '0px';
		colorPicker.style.cursor = 'pointer';
		colorPicker.style.backgroundColor = 'transparent';
		colorPicker.addEventListener('input', () => {
			this._selectedBaseColor = colorPicker.value;
			this._activeButtonColor = this._selectedBaseColor;

			this._updateDrawingToolColorsAndOpacity();
			this._updateButtonStyles();
		});
		this._drawingsToolbarContainer.appendChild(colorPicker);

		const opacitySlider = document.createElement('input');
		opacitySlider.type = 'range';
		opacitySlider.min = '0';
		opacitySlider.max = '1';
		opacitySlider.step = '0.01';
		opacitySlider.value = this._currentOpacity.toString();
		opacitySlider.style.width = '80px';
		opacitySlider.addEventListener('input', () => {
			this._currentOpacity = parseFloat(opacitySlider.value);
			this._updateDrawingToolColorsAndOpacity();
		});
		this._drawingsToolbarContainer.appendChild(opacitySlider);
    }

	private _hexToRgba(hex: string, alpha: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	private _updateDrawingToolColorsAndOpacity() {
		const previewOpacityFactor = 0.5;
		this._lineTool.options.lineColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity);
		this._lineTool.options.previewLineColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity * previewOpacityFactor);
		this._lineTool.options.labelColor = this._selectedBaseColor;		
		this._rectangleTool.options.fillColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity);
		this._rectangleTool.options.previewFillColor = this._hexToRgba(this._selectedBaseColor, this._currentOpacity * previewOpacityFactor);
		this._rectangleTool.options.labelColor = this._selectedBaseColor;	
	}

	selectRectangleTool() {
        if (this._currentTool === 'rectangle') {
            this.stopDrawing();
            return;
        }
		this._stopAllDrawing();
		this._currentTool = 'rectangle';
		this._rectangleTool.startDrawing();
        this._updateButtonStyles();
	}

	selectLineTool() {
        if (this._currentTool === 'line') {
            this.stopDrawing();
            return;
        }
		this._stopAllDrawing();
		this._currentTool = 'line';
		this._lineTool.startDrawing();
        this._updateButtonStyles();
	}

	stopDrawing() {
		this._stopAllDrawing();
		this._currentTool = null;
        this._updateButtonStyles();
	}

	private _stopAllDrawing() {
		this._rectangleTool.stopDrawing();
		this._lineTool.stopDrawing();
	}

    private _updateButtonStyles() {
        if (this._rectangleButton) {
            this._rectangleButton.style.fill = this._currentTool === 'rectangle' ? this._activeButtonColor : this._inactiveColor;
        }
        if (this._lineButton) {
            this._lineButton.style.fill = this._currentTool === 'line' ? this._activeButtonColor : this._inactiveColor;
        }
    }

	getCurrentTool() {
		return this._currentTool;
	}

	remove() {
        this.stopDrawing();
		this._rectangleTool.remove();
		this._lineTool.remove();
        this._drawingsToolbarContainer.innerHTML = '';
	}
}