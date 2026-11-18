import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { TextWidthCache } from '../model/text-width-cache';
import { TimeScalePosition } from '../model/time-scale';

export interface TimeAxisViewRendererOptions {
	baselineOffset: number;
	borderSize: number;
	font: string;
	fontSize: number;
	paddingBottom: number;
	paddingTop: number;
	tickLength: number;
	paddingHorizontal: number;
	widthCache: TextWidthCache;
	labelBottomOffset: number;
	position: TimeScalePosition;
}

export interface ITimeAxisViewRenderer {
	draw(target: CanvasRenderingTarget2D, rendererOptions: TimeAxisViewRendererOptions): void;
}
