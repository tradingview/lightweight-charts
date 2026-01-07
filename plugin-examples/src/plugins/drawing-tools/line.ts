import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	IChartApi,
	ISeriesApi,
	SeriesType,
	MouseEventParams,
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	ISeriesPrimitiveAxisView,
	Coordinate,
	PrimitiveHoveredItem
} from 'lightweight-charts';
import { ensureDefined } from '../../helpers/assertions';
import { PluginBase } from '../plugin-base';
import { Point, ViewPoint } from './types';
import { ShapeIdGenerator } from './drawing-tools';
import { IShape, IPreviewShape, IDrawingTool } from './interfaces';
import { defaultLineOptions, LineDrawingToolOptions } from './options';

class LinePaneRenderer implements IPrimitivePaneRenderer {
	p1: ViewPoint;
	p2: ViewPoint;
	_lineColor: string;
	_lineWidth: number;

	constructor(p1: ViewPoint, p2: ViewPoint, lineColor: string, lineWidth: number) {
		this.p1 = p1;
		this.p2 = p2;
		this._lineColor = lineColor;
		this._lineWidth = lineWidth;
	}

	draw(target: CanvasRenderingTarget2D) {
		target.useBitmapCoordinateSpace(scope => {
			if (
				this.p1.x === null ||
				this.p1.y === null ||
				this.p2.x === null ||
				this.p2.y === null
			)
				return;
			const ctx = scope.context;
			
			const x1 = this.p1.x * scope.horizontalPixelRatio;
			const y1 = this.p1.y * scope.verticalPixelRatio;
			const x2 = this.p2.x * scope.horizontalPixelRatio;
			const y2 = this.p2.y * scope.verticalPixelRatio;

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

class LinePaneView implements IPrimitivePaneView {
	_source: Line;
	p1: ViewPoint = { x: null, y: null };
	p2: ViewPoint = { x: null, y: null };

	constructor(source: Line) {
		this._source = source;
	}

	update() {
		const series = this._source.series;
		const y1 = series.priceToCoordinate(this._source.p1.price);
		const y2 = series.priceToCoordinate(this._source.p2.price);
		const timeScale = this._source.chart.timeScale();
		const x1 = timeScale.timeToCoordinate(this._source.p1.time);
		const x2 = timeScale.timeToCoordinate(this._source.p2.time);
		this.p1 = { x: x1, y: y1 };
		this.p2 = { x: x2, y: y2 };
	}

	renderer() {
		return new LinePaneRenderer(
			this.p1,
			this.p2,
			this._source.option.lineColor,
			this._source.option.lineWidth
		);
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
		return this._source.option.showLabels;
	}

	tickVisible(): boolean {
		return this._source.option.showLabels;
	}

	textColor() {
		return this._source.option.labelTextColor;
	}
	backColor() {
		return this._source.option.labelColor;
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
		return this._source.option.timeLabelFormatter(this._p.time);
	}
}

class LinePriceAxisView extends LineAxisView {
	update() {
		const series = this._source.series;
		this._pos = series.priceToCoordinate(this._p.price);
	}
	text() {
		return this._source.option.priceLabelFormatter(this._p.price);
	}
}


export class Line extends PluginBase implements IShape {
	id: string;
	option: LineDrawingToolOptions;
	p1: Point;
	p2: Point;
	_paneViews: LinePaneView[];
	_timeAxisViews: LineTimeAxisView[];
	_priceAxisViews: LinePriceAxisView[];

	constructor(
		p1: Point,
		p2: Point,
		options: Partial<LineDrawingToolOptions> = {}
	) {
		super();
		this.id = ShapeIdGenerator.getNextId();
		this.p1 = p1;
		this.p2 = p2;
		this.option = {
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
		this.option = { ...this.option, ...options };
		this.requestUpdate();
	}

	public hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null {
		if (!this._paneViews || !this._paneViews[0]) {
			return null;
		}
		const p1View = this._paneViews[0].p1;
		const p2View = this._paneViews[0].p2;

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
		const tolerance = (this.option.lineWidth / 2) + 2;
		if (distanceSq <= tolerance * tolerance) {
			return {
				externalId: this.id,
				zOrder: 'normal',
				cursorStyle: 'pointer',
			};
		}
		return null;
	}
}

export class PreviewLine extends Line implements IPreviewShape {
	constructor(
		p1: Point,
		p2: Point,
		options: Partial<LineDrawingToolOptions> = {}
	) {
		super(p1, p2, options);
		this.option.lineColor = this.option.previewLineColor;
	}

	public updateEndPoint(p: Point) {
		this.p2 = p;
		this._paneViews[0].update();
		this._timeAxisViews[1].movePoint(p);
		this._priceAxisViews[1].movePoint(p);
		this.requestUpdate();
	}
}

export class LineDrawingTool implements IDrawingTool {
	chart: IChartApi;
	series: ISeriesApi<SeriesType>;
	defaultOptions: Partial<LineDrawingToolOptions>;
	private _lines: Line[];
	private _previewLine: PreviewLine | undefined = undefined;
	points: Point[] = [];
	drawing: boolean = false;
	onDrawingCompleteCallback: () => void;

	constructor(
		chart: IChartApi,
		series: ISeriesApi<SeriesType>,
		options: Partial<LineDrawingToolOptions>,
		onDrawingCompleteCallback: () => void
	) {
		this.chart = chart;
		this.series = series;
		this.defaultOptions = options;
		this.onDrawingCompleteCallback = onDrawingCompleteCallback;
		this._lines = [];
		this.chart.subscribeClick(this.onClick.bind(this));
		this.chart.subscribeCrosshairMove(this.onMouseMove.bind(this));
		this.chart.subscribeDblClick(this.onDblClick.bind(this));
	}

	public get options(): Partial<LineDrawingToolOptions> {
		return this.defaultOptions;
	}

	remove() {
		this._lines.forEach(line => this._removeLine(line));
		this.stopDrawing();
		this.chart.unsubscribeClick(this.onClick);
		this.chart.unsubscribeCrosshairMove(this.onMouseMove);
		this._lines.forEach(line => {
			this._removeLine(line);
		});
		this._lines = [];
		this._removePreviewLine();
		this.chart.unsubscribeDblClick(this.onDblClick);
	}

	startDrawing(): void {
		this.drawing = true;
		this.points = [];
	}

	stopDrawing(): void {
		this.drawing = false;
		this.points = [];
		this._removePreviewLine();
	}

	isDrawing(): boolean {
		return this.drawing;
	}

	onClick = (param: MouseEventParams) => {
		if (!this.drawing || !param.point || !param.time || !this.series) return;
		const price = this.series.coordinateToPrice(param.point.y);
		if (price === null) {
			return;
		}
		this.addPoint({
			time: param.time,
			price,
		});
	}

	onMouseMove = (param: MouseEventParams) => {
		if (!this.drawing || !param.point || !param.time || !this.series) return;
		const price = this.series.coordinateToPrice(param.point.y);
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

	onDblClick = (param: MouseEventParams) => {
		if (this.drawing) return;

		const hoveredId = param.hoveredObjectId as string | undefined;
		if (!hoveredId) return;

		const lineIndex = this._lines.findIndex(line => line.id === hoveredId);
		if (lineIndex !== -1) {
			const lineToRemove = this._lines[lineIndex];
			this._removeLine(lineToRemove);
			this._lines.splice(lineIndex, 1);
		}
	}

	addPoint(p: Point) {
		this.points.push(p);
		if (this.points.length >= 2) {
			this._addNewLine(this.points[0], this.points[1]);
			this.stopDrawing(); 
			if (this.onDrawingCompleteCallback) {
				this.onDrawingCompleteCallback();
			}
		}
		if (this.points.length === 1) {
			this._addPreviewLine(this.points[0]);
		}
	}

	private _addNewLine(p1: Point, p2: Point) {
		const line = new Line(p1, p2, { ...this.defaultOptions });
		this._lines.push(line);
		ensureDefined(this.series).attachPrimitive(line);
	}

	private _removeLine(line: Line) {
		ensureDefined(this.series).detachPrimitive(line);
	}

	private _addPreviewLine(p: Point) {
		this._previewLine = new PreviewLine(p, p, {
			...this.defaultOptions,
		});
		ensureDefined(this.series).attachPrimitive(this._previewLine);
	}

	private _removePreviewLine() {
		if (this._previewLine) {
			ensureDefined(this.series).detachPrimitive(this._previewLine);
			this._previewLine = undefined;
		}
	}
} 