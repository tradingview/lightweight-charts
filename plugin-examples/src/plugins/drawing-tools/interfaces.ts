import { 
	MouseEventParams,
	ISeriesPrimitiveBase
} from 'lightweight-charts';
import { Point } from './types';

export interface IDrawingTool {
	/**
	 * Handles mouse click event.
	 * @param param Mouse event parameters
	 */
	onClick(param: MouseEventParams): void;

	/**
	 * Handles mouse move event.
	 * @param param Mouse event parameters
	 */
	onMouseMove(param: MouseEventParams): void;

	/**
	 * Handles mouse double click event.
	 * @param param Mouse event parameters
	 */
	onDblClick(param: MouseEventParams): void;

	/**
	 * Adds a new point to the shape.
	 * @param p Coordinates of the point to add
	 */
	addPoint(p: Point): void;

	/**
	 * Removes the shape.
	 */
	remove(): void;

	/**
	 * Starts drawing the shape.
	 */
	startDrawing(): void;

	/**
	 * Stops drawing the shape.
	 */
	stopDrawing(): void;

	/**
	 * Returns the current drawing state.
	 * @returns Whether the shape is being drawn
	 */
	isDrawing(): boolean;
}

export interface IShape extends ISeriesPrimitiveBase {
	/**
	 * Updates the shape's options.
	 * @param options Options to update
	 */
	applyOptions(options: any): void;
}

export interface IPreviewShape extends IShape {
	/**
	 * Updates the end point of the shape.
	 * @param p Coordinates of the new end point
	 */
	updateEndPoint(p: Point): void;
} 