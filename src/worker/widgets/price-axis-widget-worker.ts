import { ChartModel } from '../../model/chart-model';
import { PriceScale } from '../../model/price-scale';
import { TextWidthCache } from '../../model/text-width-cache';
import { drawPriceAxisTicksAndBorder, UniversalCanvasTarget2D } from '../../renderers/axis-base-renderers';
import { PriceAxisViewRendererOptions } from '../../renderers/iprice-axis-view-renderer';

import { BitmapScope, OffscreenCanvasTarget2D } from '../canvas-target';

interface WorkerSelfLike { postMessage: (message: unknown) => void }

export class PriceAxisWidgetWorker {
	private readonly _model: ChartModel<unknown>;
	private readonly _ctx: OffscreenCanvasRenderingContext2D;
	private readonly _side: 'left' | 'right';
	private _width: number = 0;
	private _height: number = 0;
	private readonly _textWidthCache: TextWidthCache = new TextWidthCache(200);
	private _lastPostedOptimalWidth: number = 0;

	public constructor(model: ChartModel<unknown>, ctx: OffscreenCanvasRenderingContext2D, side: 'left' | 'right') {
		this._model = model;
		this._ctx = ctx;
		this._side = side;
	}

	public setSize(width: number, height: number): void {
		this._width = Math.max(0, Math.floor(width));
		this._height = Math.max(0, Math.floor(height));
	}

	// eslint-disable-next-line complexity
	public paint(dpr: number): void {
		const target = new OffscreenCanvasTarget2D(this._ctx, Math.floor(this._width * dpr), Math.floor(this._height * dpr), 0, 0, dpr);
		const pane = this._model.panes()[0];
		if (!pane) {return;}
    // clear and fill background to ensure visibility
		target.useBitmapCoordinateSpace(({ context: ctx, bitmapSize }: BitmapScope) => {
			ctx.clearRect(0, 0, bitmapSize.width, bitmapSize.height);
      // Fill with chart background
			const top = this._model.backgroundTopColor();
			const bottom = this._model.backgroundBottomColor();
			if (top === bottom) {
				ctx.fillStyle = bottom;
				ctx.fillRect(0, 0, bitmapSize.width, bitmapSize.height);
			} else {
				const g = ctx.createLinearGradient(0, 0, 0, bitmapSize.height);
				g.addColorStop(0, top);
				g.addColorStop(1, bottom);
				ctx.fillStyle = g;
				ctx.fillRect(0, 0, bitmapSize.width, bitmapSize.height);
			}
		});

    // Draw tick marks + border like the main widget
		const priceScale = this._side === 'right' ? pane.rightPriceScale() : pane.leftPriceScale();
		const priceScaleOptions = priceScale.options();
		const rendererOptions = this._model.priceAxisRendererOptions();

    // Border + Tick marks
		const tickMarks = priceScale.marks();
		drawPriceAxisTicksAndBorder(target as unknown as UniversalCanvasTarget2D, this._side, priceScaleOptions, rendererOptions, tickMarks);

    // Tick labels in media coordinates (always draw labels)
		target.useMediaCoordinateSpace(({ context }: { context: OffscreenCanvasRenderingContext2D }) => {
			context.font = rendererOptions.font;
			context.fillStyle = priceScaleOptions.textColor ?? this._model.options()['layout'].textColor;
			context.textAlign = this._side === 'left' ? 'right' : 'left';
			context.textBaseline = 'middle';
			const textLeftX = this._side === 'left'
				? Math.round(this._width - rendererOptions.tickLength - rendererOptions.paddingInner)
				: Math.round(rendererOptions.tickLength + rendererOptions.paddingInner);
			for (const tickMark of tickMarks) {
				const yMidCorrection = this._textWidthCache.yMidCorrection(context as unknown as CanvasRenderingContext2D, tickMark.label);
				context.fillText(tickMark.label, textLeftX, tickMark.coord + yMidCorrection);
			}
		});

    // Back labels and additional sources
		const sources = pane.orderedSources();
		for (const source of sources) {
			const views = source.priceAxisViews?.(pane, priceScale) ?? [];
			for (const view of views) {
				if (typeof view.isAxisLabelVisible === 'function' && !view.isAxisLabelVisible()) { continue; }
				const renderer = view.renderer(priceScale);
				if (renderer && renderer.draw) {
					try {
						renderer.draw(
							target as unknown as import('fancy-canvas').CanvasRenderingTarget2D,
							rendererOptions,
							this._textWidthCache,
							this._side
						);
					} catch {
						// ignore renderer errors to avoid blocking worker loop
					}
				}
			}
		}

    // Measure optimal width and notify main thread if changed
		const optimal = this._measureOptimalWidth(priceScale, rendererOptions);
		if (optimal > 0 && Math.abs(optimal - this._lastPostedOptimalWidth) >= 1) {
			this._lastPostedOptimalWidth = optimal;
			// Post a message to the main thread with a minimal typed surface
			(self as unknown as WorkerSelfLike).postMessage({ type: 'axisWidth', side: this._side, width: optimal });
		}
	}

	private _measureOptimalWidth(priceScale: PriceScale, rendererOptions: PriceAxisViewRendererOptions): number {
		const ctx = this._ctx as unknown as CanvasRenderingContext2D;
		const marks = priceScale.marks();
		ctx.save();
		ctx.font = rendererOptions.font;
		let tickMarkMaxWidth = 0;
		if (marks.length > 0) {
			tickMarkMaxWidth = Math.max(
        this._textWidthCache.measureText(ctx as unknown as CanvasRenderingContext2D, marks[0].label),
        this._textWidthCache.measureText(ctx as unknown as CanvasRenderingContext2D, marks[marks.length - 1].label)
      );
		}
		ctx.restore();
		const constantsLabelOffset = 5;
		const resultTickMarksMaxWidth = tickMarkMaxWidth || 34;
		const res = Math.ceil(
			rendererOptions.borderSize +
			rendererOptions.tickLength +
			rendererOptions.paddingInner +
			rendererOptions.paddingOuter +
			constantsLabelOffset +
			resultTickMarksMaxWidth
		);
		return res;
	}
}

