import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { IDataSource, IDataSourcePaneViews } from '../model/idata-source';
import { Pane } from '../model/pane';
import { IPaneRenderer } from '../renderers/ipane-renderer';
import { IAxisView } from '../views/pane/iaxis-view';
import { IPaneView } from '../views/pane/ipane-view';

import { IAxisViewsGetter } from './iaxis-view-getters';
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

export type ViewsGetter<T> = T extends IDataSource
	? IAxisViewsGetter
	: IPaneViewsGetter;

export function drawSourceViews<T extends IDataSource | IDataSourcePaneViews>(
	paneViewsGetter: ViewsGetter<T>,
	drawRendererFn: DrawRendererFn,
	source: T,
	pane: Pane
): void {
	const views = (
		paneViewsGetter as (s: T, p: Pane) => readonly (IAxisView | IPaneView)[]
	)(source, pane);
	for (const view of views) {
		const renderer = view.renderer(pane);
		if (renderer !== null) {
			drawRendererFn(renderer);
		}
	}
}
