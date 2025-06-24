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
	_chart: IChartApi;
	_series: ISeriesApi<SeriesType>;
	_defaultOptions: any;
	_points: Point[];
	_drawing: boolean;
	_onDrawingCompleteCallback?: () => void;
	
	_clickHandler: (param: MouseEventParams) => void;
	_moveHandler: (param: MouseEventParams) => void;
	_dblClickHandler: (param: MouseEventParams) => void;
	
	_onClick(param: MouseEventParams): void;
	_onMouseMove(param: MouseEventParams): void;
	_onDblClick(param: MouseEventParams): void;
	_addPoint(p: Point): void;

	options: any;
	remove(): void;
	startDrawing(): void;
	stopDrawing(): void;
	isDrawing(): boolean;
}

export interface IShape {
	_id: string;
	_p1: Point;
	_p2: Point;
	_options: any;
	updateAllViews(): void;
	priceAxisViews(): ISeriesPrimitiveAxisView[];
	timeAxisViews(): ISeriesPrimitiveAxisView[];
	paneViews(): IPrimitivePaneView[];
	applyOptions(options: any): void;
	hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null;
}

export interface IPreviewShape {
	updateEndPoint(p: Point): void;
} 