import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { IDataSource } from '../model/idata-source';
import { Pane } from '../model/pane';
import { IPaneRenderer } from '../renderers/ipane-renderer';

import { IPaneViewsGetter } from './ipane-view-getter';

export type DrawFunction = (
	renderer: IPaneRenderer,
	target: CanvasRenderingTarget2D,
	isHovered: boolean,
	hitTestData?: unknown
) => void;

export function drawBackground(
	renderer: IPaneRenderer,
	target: CanvasRenderingTarget2D,
	isHovered: boolean,
	hitTestData?: unknown
): void {
	if (renderer.drawBackground) {
		renderer.drawBackground(target, isHovered, hitTestData);
	}
}

export function drawForeground(
	renderer: IPaneRenderer,
	target: CanvasRenderingTarget2D,
	isHovered: boolean,
	hitTestData?: unknown
): void {
	renderer.draw(target, isHovered, hitTestData);
}

type DrawRendererFn = (renderer: IPaneRenderer) => void;

export function drawSourcePaneViews(
	paneViewsGetter: IPaneViewsGetter,
	drawRendererFn: DrawRendererFn,
	source: IDataSource,
	pane: Pane
): void {
	const paneViews = paneViewsGetter(source, pane);

	for (const paneView of paneViews) {
		const renderer = paneView.renderer(pane);
		if (renderer !== null) {
			drawRendererFn(renderer);
		}
	}
}
