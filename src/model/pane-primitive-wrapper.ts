import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { IPaneRenderer } from '../renderers/ipane-renderer';
import { IPaneView } from '../views/pane/ipane-view';

import { Coordinate } from './coordinate';
import {
    IPanePrimitiveBase,
    IPrimitivePaneRenderer,
    IPrimitivePaneView,
    PrimitiveHoveredItem,
    PrimitivePaneViewZOrder,
} from './ipane-primitive';
import {
	ISeriesPrimitiveBase,
} from './iseries-primitive';
import { drawingUtils } from './primitive-drawing-utils';

class PrimitiveRendererWrapper implements IPaneRenderer {
	private readonly _baseRenderer: IPrimitivePaneRenderer;

	public constructor(baseRenderer: IPrimitivePaneRenderer) {
		this._baseRenderer = baseRenderer;
	}

	public draw(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
		this._baseRenderer.draw(target, drawingUtils);
	}

	public drawBackground?(target: CanvasRenderingTarget2D, isHovered: boolean, hitTestData?: unknown): void {
		this._baseRenderer.drawBackground?.(target, drawingUtils);
	}
}

interface RendererCache<Base, Wrapper> {
	base: Base;
	wrapper: Wrapper;
}

export interface ISeriesPrimitivePaneViewWrapper extends IPaneView {
	zOrder(): PrimitivePaneViewZOrder;
}

class PrimitivePaneViewWrapper implements IPaneView {
	private readonly _paneView: IPrimitivePaneView;
	private _cache: RendererCache<IPrimitivePaneRenderer, PrimitiveRendererWrapper> | null = null;

	public constructor(paneView: IPrimitivePaneView) {
		this._paneView = paneView;
	}

	public renderer(): IPaneRenderer | null {
		const baseRenderer = this._paneView.renderer();
		if (baseRenderer === null) {
			return null;
		}
		if (this._cache?.base === baseRenderer) {
			return this._cache.wrapper;
		}
		const wrapper = new PrimitiveRendererWrapper(baseRenderer);
		this._cache = {
			base: baseRenderer,
			wrapper,
		};
		return wrapper;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return this._paneView.zOrder?.() ?? 'normal';
	}
}

export abstract class PrimitiveWrapper<T extends ISeriesPrimitiveBase<TAttachedParameters> | IPanePrimitiveBase<TAttachedParameters>, TAttachedParameters = unknown> {
	protected readonly _primitive: T;
	private _paneViewsCache: RendererCache<readonly IPrimitivePaneView[], readonly PrimitivePaneViewWrapper[]> | null = null;

	public constructor(primitive: T) {
		this._primitive = primitive;
	}

	public primitive(): T {
		return this._primitive;
	}

	public updateAllViews(): void {
		this._primitive.updateAllViews?.();
	}

	public paneViews(): readonly ISeriesPrimitivePaneViewWrapper[] | readonly PrimitivePaneViewWrapper[] {
		const base = this._primitive.paneViews?.() ?? [];
		if (this._paneViewsCache?.base === base) {
			return this._paneViewsCache.wrapper;
		}
		const wrapper = base.map((pw: IPrimitivePaneView) => new PrimitivePaneViewWrapper(pw));
		this._paneViewsCache = {
			base,
			wrapper,
		};
		return wrapper;
	}

	public hitTest(x: Coordinate, y: Coordinate): PrimitiveHoveredItem | null {
		return this._primitive.hitTest?.(x, y) ?? null;
	}
}

export class PanePrimitiveWrapper extends PrimitiveWrapper<IPanePrimitiveBase<unknown>> {
	public labelPaneViews(): readonly IPaneView[] {
		return [];
	}
}
