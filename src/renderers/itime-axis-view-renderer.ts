import { TextWidthCache } from '../model/text-width-cache';

import { CanvasRenderingTarget } from './canvas-rendering-target';

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
}

export interface ITimeAxisViewRenderer {
	draw(target: CanvasRenderingTarget, rendererOptions: TimeAxisViewRendererOptions): void;
}
