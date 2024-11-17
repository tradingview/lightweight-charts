import { SeriesMarkerShape } from '../model/series-markers';
export declare function shapeSize(shape: SeriesMarkerShape, originalSize: number): number;
export declare function calculateShapeHeight(barSpacing: number): number;
export declare function shapeMargin(barSpacing: number): number;
export interface BitmapShapeItemCoordinates {
    x: number;
    y: number;
    pixelRatio: number;
}
export declare function calculateAdjustedMargin(margin: number, hasSide: boolean, hasInBar: boolean): number;
