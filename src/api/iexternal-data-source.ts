import { Coordinate } from "../model/coordinate";

export interface IExternalAxisView {
	coordinate(): number;
	text(): string;
	textColor(): string;
	backColor(): string;
}

export interface IExternalPaneRenderer {
	draw(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean): void;
	drawBackground?(ctx: CanvasRenderingContext2D, pixelRatio: number, isHovered: boolean): void;
	hitTest?(x: Coordinate, y: Coordinate): boolean;
}

export interface IExternalPaneView {
	renderer(height: number, width: number): IExternalPaneRenderer;
}

export interface IExternalDataSource {
	updateAllViews(): void;
	priceAxisViews(): readonly IExternalAxisView[];
	timeAxisViews(): readonly IExternalAxisView[];
	paneViews(): readonly IExternalPaneView[];
}
