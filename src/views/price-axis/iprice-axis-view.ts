import {
	IPriceAxisViewRenderer,
	PriceAxisViewRendererOptions,
} from '../../renderers/iprice-axis-view-renderer';

export interface IPriceAxisView {
	coordinate(): number;
	getFixedCoordinate(): number;
	height(rendererOptions: PriceAxisViewRendererOptions, useSecondLine?: boolean): number;
	isVisible(): boolean;
	isAxisLabelVisible(): boolean;
	renderer(): IPriceAxisViewRenderer;
	paneRenderer(): IPriceAxisViewRenderer;
	setFixedCoordinate(value: number | null): void;
	text(): string;
	update(): void;
}
