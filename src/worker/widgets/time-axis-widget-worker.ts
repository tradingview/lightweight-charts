import { clearRect } from '../../helpers/canvas-helpers';
import { makeFont } from '../../helpers/make-font';

import { ChartModel, IChartModelBase } from '../../model/chart-model';
import { IDataSource } from '../../model/idata-source';
import { TextWidthCache } from '../../model/text-width-cache';
import { drawTimeAxisTicksAndBorder, UniversalCanvasTarget2D } from '../../renderers/axis-base-renderers';
import { TimeAxisViewRendererOptions } from '../../renderers/itime-axis-view-renderer';

import { BitmapScope, OffscreenCanvasTarget2D } from '../canvas-target';

export class TimeAxisWidgetWorker {
	private readonly _model: ChartModel<unknown>;
	private readonly _ctx: OffscreenCanvasRenderingContext2D;
	private _width: number = 0;
	private _height: number = 0;
	private readonly _widthCache: TextWidthCache = new TextWidthCache(5);
	private _rendererOptions: TimeAxisViewRendererOptions | null = null;

	public constructor(model: ChartModel<unknown>, ctx: OffscreenCanvasRenderingContext2D) {
		this._model = model;
		this._ctx = ctx;
	}

	public setSize(width: number, height: number): void {
		this._width = Math.max(0, Math.floor(width));
		this._height = Math.max(0, Math.floor(height));
	}

	public paint(dpr: number): void {
		const bitmapWidth = Math.floor(this._width * dpr);
		const bitmapHeight = Math.floor(this._height * dpr);
		const target = new OffscreenCanvasTarget2D(this._ctx, bitmapWidth, bitmapHeight, 0, 0, dpr);
		// Background
		target.useBitmapCoordinateSpace(({ context, bitmapSize }: BitmapScope) => {
			clearRect(context as unknown as CanvasRenderingContext2D, 0, 0, bitmapSize.width, bitmapSize.height, this._model.backgroundBottomColor());
		});
		this._drawTicksAndLabels(target);
		this._drawTopLabels(target);
	}

	private _opts(): Readonly<ReturnType<IChartModelBase['options']>['timeScale']> {
		return this._model.options().timeScale;
	}

	private _layout(): Readonly<ReturnType<IChartModelBase['options']>['layout']> {
		return this._model.options()['layout'];
	}

	private _rendererOpts(): Readonly<TimeAxisViewRendererOptions> {
		if (this._rendererOptions === null) {
			this._rendererOptions = {
				borderSize: 1,
				baselineOffset: 0,
				paddingTop: 0,
				paddingBottom: 0,
				paddingHorizontal: 0,
				tickLength: 5,
				fontSize: 11,
				font: '',
				widthCache: this._widthCache,
				labelBottomOffset: 0,
			};
		}
		const ro = this._rendererOptions;
		const fontSize = this._layout().fontSize;
		const fontFamily = this._layout().fontFamily;
		const font = makeFont(fontSize, fontFamily);
		if (ro.font !== font) {
			ro.font = font;
			ro.fontSize = fontSize;
			ro.paddingTop = (3 * fontSize) / 12;
			ro.paddingBottom = (3 * fontSize) / 12;
			ro.paddingHorizontal = (9 * fontSize) / 12;
			ro.labelBottomOffset = (4 * fontSize) / 12;
			ro.widthCache.reset();
		}
		return ro;
	}

	private _drawTicksAndLabels(target: OffscreenCanvasTarget2D): void {
		const timeScale = this._model.timeScale();
		const tickMarks = timeScale.marks();
		if (!tickMarks || tickMarks.length === 0) { return; }
		const ro = this._rendererOpts();
		drawTimeAxisTicksAndBorder(target as unknown as UniversalCanvasTarget2D, this._opts(), ro, tickMarks);
		target.useMediaCoordinateSpace(({ context }: { context: OffscreenCanvasRenderingContext2D }) => {
			const yText = ro.borderSize + ro.tickLength + ro.paddingTop + ro.fontSize / 2;
			context.textAlign = 'center';
			context.textBaseline = 'middle';
			context.fillStyle = this._layout().textColor;
			context.font = ro.font;
			for (const tm of tickMarks) {
				context.fillText(tm.label, tm.coord, yText);
			}
		});
	}

	private _drawTopLabels(target: OffscreenCanvasTarget2D): void {
		const sources: readonly (IDataSource | ReturnType<ChartModel<unknown>['crosshairSource']>)[] = [
			...this._model.serieses(),
			this._model.crosshairSource(),
		];
		const ro = this._rendererOpts();
		for (const src of sources) {
			const views = src.timeAxisViews?.() ?? [];
			for (const v of views) {
				const renderer = v.renderer();
				renderer.draw(target as unknown as import('fancy-canvas').CanvasRenderingTarget2D, ro);
			}
		}
	}
}

