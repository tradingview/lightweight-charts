import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { Coordinate } from '../model/coordinate';
export interface GradientCacheParams {
    topColor1: string;
    topColor2: string;
    bottomColor1: string;
    bottomColor2: string;
    baseLevelCoordinate?: Coordinate | null;
    bottom: Coordinate;
}
export declare class GradientStyleCache {
    private _params?;
    private _cachedValue?;
    get(scope: BitmapCoordinatesRenderingScope, params: GradientCacheParams): CanvasGradient;
}
