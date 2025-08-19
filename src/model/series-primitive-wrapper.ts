import { CanvasRenderingTarget2D } from 'fancy-canvas';

import { IPaneRenderer } from '../renderers/ipane-renderer';
import { PriceAxisViewRendererCommonData, PriceAxisViewRendererData } from '../renderers/iprice-axis-view-renderer';
import { TimeAxisViewRenderer } from '../renderers/time-axis-view-renderer';
import { IPaneView } from '../views/pane/ipane-view';
import { IPriceAxisView } from '../views/price-axis/iprice-axis-view';
import { PriceAxisView } from '../views/price-axis/price-axis-view';
import { ITimeAxisView } from '../views/time-axis/itime-axis-view';

import { IPrimitivePaneRenderer, IPrimitivePaneView, PrimitivePaneViewZOrder } from './ipane-primitive';
import {
	ISeriesPrimitiveAxisView,
	ISeriesPrimitiveBase,
} from './iseries-primitive';
import { PrimitiveWrapper } from './pane-primitive-wrapper';
import { PriceScale } from './price-scale';
import { drawingUtils } from './primitive-drawing-utils';
import { Series } from './series';
import { AutoscaleInfo, SeriesType } from './series-options';
import { Logical, TimePointIndex } from './time-data';
import { ITimeScale } from './time-scale';

class SeriesPrimitiveRendererWrapper implements IPaneRenderer {
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

class SeriesPrimitivePaneViewWrapper implements IPaneView {
	private readonly _paneView: IPrimitivePaneView;
	private _cache: RendererCache<IPrimitivePaneRenderer, SeriesPrimitiveRendererWrapper> | null = null;

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
		const wrapper = new SeriesPrimitiveRendererWrapper(baseRenderer);
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

interface AxisViewData {
	text: string;
	coordinate: number;
	fixedCoordinate: number | undefined;
	color: string;
	background: string;
	visible: boolean;
	tickVisible: boolean;
}

function getAxisViewData(baseView: ISeriesPrimitiveAxisView): AxisViewData {
	return {
		text: baseView.text(),
		coordinate: baseView.coordinate(),
		fixedCoordinate: baseView.fixedCoordinate?.(),
		color: baseView.textColor(),
		background: baseView.backColor(),
		visible: baseView.visible?.() ?? true,
		tickVisible: baseView.tickVisible?.() ?? true,
	};
}

class SeriesPrimitiveTimeAxisViewWrapper implements ITimeAxisView {
	private readonly _baseView: ISeriesPrimitiveAxisView;
	private readonly _timeScale: ITimeScale;
	private readonly _renderer: TimeAxisViewRenderer = new TimeAxisViewRenderer();

	public constructor(baseView: ISeriesPrimitiveAxisView, timeScale: ITimeScale) {
		this._baseView = baseView;
		this._timeScale = timeScale;
	}

	public renderer(): TimeAxisViewRenderer {
		this._renderer.setData({
			width: this._timeScale.width(),
			...getAxisViewData(this._baseView),
		});
		return this._renderer;
	}
}

class SeriesPrimitivePriceAxisViewWrapper extends PriceAxisView {
	private readonly _baseView: ISeriesPrimitiveAxisView;
	private readonly _priceScale: PriceScale;

	public constructor(baseView: ISeriesPrimitiveAxisView, priceScale: PriceScale) {
		super();
		this._baseView = baseView;
		this._priceScale = priceScale;
	}

	protected override _updateRendererData(
		axisRendererData: PriceAxisViewRendererData,
		paneRendererData: PriceAxisViewRendererData,
		commonRendererData: PriceAxisViewRendererCommonData
	): void {
		const data = getAxisViewData(this._baseView);
		commonRendererData.background = data.background;
		axisRendererData.color = data.color;

		const additionalPadding = 2 / 12 * this._priceScale.fontSize();

		commonRendererData.additionalPaddingTop = additionalPadding;
		commonRendererData.additionalPaddingBottom = additionalPadding;

		commonRendererData.coordinate = data.coordinate;
		commonRendererData.fixedCoordinate = data.fixedCoordinate;
		axisRendererData.text = data.text;
		axisRendererData.visible = data.visible;
		axisRendererData.tickVisible = data.tickVisible;
	}
}

export class SeriesPrimitiveWrapper<TSeriesAttachedParameters = unknown> extends PrimitiveWrapper<ISeriesPrimitiveBase<TSeriesAttachedParameters>> {
	private readonly _series: Series<SeriesType>;
	private _timeAxisViewsCache: RendererCache<readonly ISeriesPrimitiveAxisView[], readonly SeriesPrimitiveTimeAxisViewWrapper[]> | null = null;
	private _priceAxisViewsCache: RendererCache<readonly ISeriesPrimitiveAxisView[], readonly SeriesPrimitivePriceAxisViewWrapper[]> | null = null;
	private _priceAxisPaneViewsCache: RendererCache<readonly IPrimitivePaneView[], readonly SeriesPrimitivePaneViewWrapper[]> | null = null;
	private _timeAxisPaneViewsCache: RendererCache<readonly IPrimitivePaneView[], readonly SeriesPrimitivePaneViewWrapper[]> | null = null;

	public constructor(primitive: ISeriesPrimitiveBase<TSeriesAttachedParameters>, series: Series<SeriesType>) {
		super(primitive);
		this._series = series;
	}

	public timeAxisViews(): readonly ITimeAxisView[] {
		const base = this._primitive.timeAxisViews?.() ?? [];
		if (this._timeAxisViewsCache?.base === base) {
			return this._timeAxisViewsCache.wrapper;
		}
		const timeScale = this._series.model().timeScale();
		const wrapper = base.map((aw: ISeriesPrimitiveAxisView) => new SeriesPrimitiveTimeAxisViewWrapper(aw, timeScale));
		this._timeAxisViewsCache = {
			base,
			wrapper,
		};
		return wrapper;
	}

	public priceAxisViews(): readonly IPriceAxisView[] {
		const base = this._primitive.priceAxisViews?.() ?? [];
		if (this._priceAxisViewsCache?.base === base) {
			return this._priceAxisViewsCache.wrapper;
		}
		const priceScale = this._series.priceScale();
		const wrapper = base.map((aw: ISeriesPrimitiveAxisView) => new SeriesPrimitivePriceAxisViewWrapper(aw, priceScale));
		this._priceAxisViewsCache = {
			base,
			wrapper,
		};
		return wrapper;
	}

	public priceAxisPaneViews(): readonly ISeriesPrimitivePaneViewWrapper[] {
		const base = this._primitive.priceAxisPaneViews?.() ?? [];
		if (this._priceAxisPaneViewsCache?.base === base) {
			return this._priceAxisPaneViewsCache.wrapper;
		}
		const wrapper = base.map((pw: IPrimitivePaneView) => new SeriesPrimitivePaneViewWrapper(pw));
		this._priceAxisPaneViewsCache = {
			base,
			wrapper,
		};
		return wrapper;
	}

	public timeAxisPaneViews(): readonly ISeriesPrimitivePaneViewWrapper[] {
		const base = this._primitive.timeAxisPaneViews?.() ?? [];
		if (this._timeAxisPaneViewsCache?.base === base) {
			return this._timeAxisPaneViewsCache.wrapper;
		}
		const wrapper = base.map((pw: IPrimitivePaneView) => new SeriesPrimitivePaneViewWrapper(pw));
		this._timeAxisPaneViewsCache = {
			base,
			wrapper,
		};
		return wrapper;
	}

	public autoscaleInfo(
		startTimePoint: TimePointIndex,
		endTimePoint: TimePointIndex
	): AutoscaleInfo | null {
		return (
			this._primitive.autoscaleInfo?.(
				startTimePoint as unknown as Logical,
				endTimePoint as unknown as Logical
			) ?? null
		);
	}
}
