import { Coordinate, TimePointIndex } from "lightweight-charts";

// --------------------------------------------------
export type UpdateType = "data" | "other" | "options";

// --------------------------------------------------
export interface IMinMaxPriceMarkersOptions {
	textColor: string;
	zOrder: "top" | "aboveSeries" | "normal";
}

// --------------------------------------------------
export interface ISeriesMarkerRendererData {
	time: TimePointIndex;
	x: Coordinate;
	y: Coordinate;
	color: string;
	text?: {
		content: string;
		x: Coordinate;
		y: Coordinate;
		width: number;
		height: number;
	};
	variant: "left" | "right";
}

// --------------------------------------------------
export interface IBitmapShapeItemCoordinates {
	x: number;
	y: number;
	pixelRatio: number;
}
