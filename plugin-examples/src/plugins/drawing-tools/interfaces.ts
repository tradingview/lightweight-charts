import { 
	Coordinate, 
	IChartApi, 
	ISeriesApi, 
	IPrimitivePaneView, 
	ISeriesPrimitiveAxisView, 
	MouseEventParams, 
	PrimitiveHoveredItem,
	SeriesType
} from 'lightweight-charts';
import { Point } from './types';

export interface IDrawingTool {
	chart: IChartApi;
	series: ISeriesApi<SeriesType>;
	defaultOptions: any;
	points: Point[];
	drawing: boolean;
	options: any;
	onDrawingCompleteCallback: () => void;

	onClick(param: MouseEventParams): void;
	onMouseMove(param: MouseEventParams): void;
	onDblClick(param: MouseEventParams): void;
	addPoint(p: Point): void;
	remove(): void;
	startDrawing(): void;
	stopDrawing(): void;
	isDrawing(): boolean;
}

export interface IShape {
	id: string;
	p1: Point;
	p2: Point;
	option: any;

	updateAllViews(): void;
	priceAxisViews(): ISeriesPrimitiveAxisView[];
	timeAxisViews(): ISeriesPrimitiveAxisView[];
	paneViews(): IPrimitivePaneView[];
	applyOptions(options: any): void;
	hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null;
}

export interface IPreviewShape extends IShape {
	updateEndPoint(p: Point): void;
} 