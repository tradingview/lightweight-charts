import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { IPaneRenderer } from '../../renderers/ipane-renderer';
import { IPaneView } from '../../views/pane/ipane-view';

export class FillSeriesCompositeRenderer implements IPaneRenderer {
	private readonly _fillRenderer: IPaneRenderer;
	private readonly _lineRenderer: IPaneRenderer;
	private readonly _shouldDrawLineOnTop: () => boolean;

	public constructor(
		fillRenderer: IPaneRenderer,
		lineRenderer: IPaneRenderer,
		shouldDrawLineOnTop: () => boolean
	) {
		this._fillRenderer = fillRenderer;
		this._lineRenderer = lineRenderer;
		this._shouldDrawLineOnTop = shouldDrawLineOnTop;
	}

	public draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
		this._fillRenderer.draw(target, isHovered, hitTestData);
		if (!isHovered || !this._shouldDrawLineOnTop()) {
			this._lineRenderer.draw(target, isHovered, hitTestData);
		}
	}
}

export class FillSeriesLinePaneView implements IPaneView {
	private readonly _lineRenderer: IPaneRenderer;
	private readonly _shouldRender: () => boolean;

	public constructor(lineRenderer: IPaneRenderer, shouldRender: () => boolean) {
		this._lineRenderer = lineRenderer;
		this._shouldRender = shouldRender;
	}

	public renderer(): IPaneRenderer | null {
		return this._shouldRender() ? this._lineRenderer : null;
	}
}
