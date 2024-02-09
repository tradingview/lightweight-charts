import { Coordinate } from '../model/coordinate';
export declare function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, horizontalPixelRatio: number, verticalPixelRatio: number): void;
export declare function hitTestText(textX: number, textY: number, textWidth: number, textHeight: number, x: Coordinate, y: Coordinate): boolean;
