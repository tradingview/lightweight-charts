import { Coordinate } from '../model/coordinate';
import { BitmapShapeItemCoordinates } from './series-markers-utils';
export declare function drawArrow(up: boolean, ctx: CanvasRenderingContext2D, coords: BitmapShapeItemCoordinates, size: number): void;
export declare function hitTestArrow(up: boolean, centerX: Coordinate, centerY: Coordinate, size: number, x: Coordinate, y: Coordinate): boolean;
