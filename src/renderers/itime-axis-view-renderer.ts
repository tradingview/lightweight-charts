import { TextWidthCache } from '../model/text-width-cache';

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
}

export interface ITimeAxisViewRenderer {
	draw(ctx: CanvasRenderingContext2D, rendererOptions: TimeAxisViewRendererOptions, pixelRatio: number): void;
}
