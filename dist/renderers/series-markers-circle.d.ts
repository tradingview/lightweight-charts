import { Coordinate } from '../model/coordinate';
import { BitmapShapeItemCoordinates } from './series-markers-utils';
export declare function drawCircle(ctx: CanvasRenderingContext2D, coords: BitmapShapeItemCoordinates, size: number): void;
export declare function hitTestCircle(centerX: Coordinate, centerY: Coordinate, size: number, x: Coordinate, y: Coordinate): boolean;
