import { Coordinate } from '../model/coordinate';
/**
 * Represents the width of a line.
 */
export type LineWidth = 1 | 2 | 3 | 4;
/**
 * Represents the possible line types.
 */
export declare const enum LineType {
    /**
     * A line.
     */
    Simple = 0,
    /**
     * A stepped line.
     */
    WithSteps = 1,
    /**
     * A curved line.
     */
    Curved = 2
}
/**
 * A point on a line.
 */
export interface LinePoint {
    /**
     * The point's x coordinate.
     */
    x: Coordinate;
    /**
     * The point's y coordinate.
     */
    y: Coordinate;
}
/**
 * Represents the possible line styles.
 */
export declare const enum LineStyle {
    /**
     * A solid line.
     */
    Solid = 0,
    /**
     * A dotted line.
     */
    Dotted = 1,
    /**
     * A dashed line.
     */
    Dashed = 2,
    /**
     * A dashed line with bigger dashes.
     */
    LargeDashed = 3,
    /**
     * A dotted line with more space between dots.
     */
    SparseDotted = 4
}
export declare function setLineStyle(ctx: CanvasRenderingContext2D, style: LineStyle): void;
export declare function drawHorizontalLine(ctx: CanvasRenderingContext2D, y: number, left: number, right: number): void;
export declare function drawVerticalLine(ctx: CanvasRenderingContext2D, x: number, top: number, bottom: number): void;
export declare function strokeInPixel(ctx: CanvasRenderingContext2D, drawFunction: () => void): void;
