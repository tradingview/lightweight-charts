import { BitmapCoordinatesRenderingScope } from 'fancy-canvas';
import { SeriesItemsIndexesRange } from '../model/time-data';
import { LinePoint } from './draw-line';
export declare function drawSeriesPointMarkers<TItem extends LinePoint, TStyle extends CanvasRenderingContext2D['fillStyle']>(renderingScope: BitmapCoordinatesRenderingScope, items: readonly TItem[], pointMarkersRadius: number, visibleRange: SeriesItemsIndexesRange, styleGetter: (renderingScope: BitmapCoordinatesRenderingScope, item: TItem) => TStyle): void;
