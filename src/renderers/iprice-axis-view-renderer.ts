import { TextWidthCache } from '../model/text-width-cache';

import { CanvasRenderingTarget } from './canvas-rendering-target';
import { LineWidth } from './draw-line';

export interface PriceAxisViewRendererCommonData {
	activeBackground?: string;
	background: string;
	color: string;
	coordinate: number;
	fixedCoordinate?: number;
}

export interface PriceAxisViewRendererData {
	visible: boolean;
	text: string;
	tickVisible: boolean;
	moveTextToInvisibleTick: boolean;
	borderColor: string;
	lineWidth?: LineWidth;
}

export interface PriceAxisViewRendererOptions {
	baselineOffset: number;
	borderSize: number;
	font: string;
	fontFamily: string;
	color: string;
	fontSize: number;
	paddingBottom: number;
	paddingInner: number;
	paddingOuter: number;
	paddingTop: number;
	tickLength: number;
}

export interface IPriceAxisViewRenderer {
	draw(
		target: CanvasRenderingTarget,
		rendererOptions: PriceAxisViewRendererOptions,
		textWidthCache: TextWidthCache,
		width: number,
		align: 'left' | 'right'
	): void;

	height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine: boolean): number;
	setData(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData): void;
}

export type IPriceAxisViewRendererConstructor = new(data: PriceAxisViewRendererData, commonData: PriceAxisViewRendererCommonData) => IPriceAxisViewRenderer;
