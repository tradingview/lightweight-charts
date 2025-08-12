import { PriceAxisViewRendererOptions } from './iprice-axis-view-renderer';
import { TimeAxisViewRendererOptions } from './itime-axis-view-renderer';

// Minimal target interface to work with both fancy-canvas target and worker target
interface UniversalBitmapScope {
	context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
	bitmapSize: { width: number; height: number };
	horizontalPixelRatio: number;
	verticalPixelRatio: number;
}

interface UniversalMediaScope {
	context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}

export interface UniversalCanvasTarget2D {
	useBitmapCoordinateSpace<T>(fn: (scope: UniversalBitmapScope) => T): T;
	useMediaCoordinateSpace<T>(fn: (scope: UniversalMediaScope) => T): T;
}

export interface TimeScaleTicksOptions {
	borderVisible: boolean;
	borderColor: string;
	ticksVisible: boolean;
}

export interface PriceScaleTicksOptions extends TimeScaleTicksOptions {}

export interface TimeTickMark { coord: number; label: string }
export interface PriceTickMark { coord: number; label: string }

export function drawTimeAxisTicksAndBorder(
    target: UniversalCanvasTarget2D,
    options: TimeScaleTicksOptions,
    rendererOptions: Readonly<TimeAxisViewRendererOptions>,
    tickMarks: readonly TimeTickMark[] | null | undefined
): void {
	if (options.borderVisible) {
		target.useBitmapCoordinateSpace(({ context, bitmapSize, verticalPixelRatio }: UniversalBitmapScope) => {
			const ctx = context as CanvasRenderingContext2D;
			ctx.fillStyle = options.borderColor;
			const borderSize = Math.max(1, Math.floor(rendererOptions.borderSize * verticalPixelRatio));
			ctx.fillRect(0, 0, bitmapSize.width, borderSize);
		});
	}
	if (!tickMarks || tickMarks.length === 0) { return; }
	if (options.borderVisible && options.ticksVisible) {
		target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio, verticalPixelRatio }: UniversalBitmapScope) => {
			const ctx = context as CanvasRenderingContext2D;
			ctx.fillStyle = options.borderColor;
			const tickWidth = Math.max(1, Math.floor(horizontalPixelRatio));
			const tickOffset = Math.floor(horizontalPixelRatio * 0.5);
			const tickLen = Math.round(rendererOptions.tickLength * verticalPixelRatio);
			ctx.beginPath();
			for (const tm of tickMarks) {
				const x = Math.round(tm.coord * horizontalPixelRatio);
				ctx.rect(x - tickOffset, 0, tickWidth, tickLen);
			}
			ctx.fill();
		});
	}
}

export function drawPriceAxisTicksAndBorder(
    target: UniversalCanvasTarget2D,
    side: 'left' | 'right',
    options: PriceScaleTicksOptions,
    rendererOptions: Readonly<PriceAxisViewRendererOptions>,
    tickMarks: readonly PriceTickMark[] | null | undefined
): void {
	if (options.borderVisible) {
		target.useBitmapCoordinateSpace(({ context, bitmapSize, horizontalPixelRatio }: UniversalBitmapScope) => {
			const ctx = context as CanvasRenderingContext2D;
			ctx.fillStyle = options.borderColor;
			const borderSize = Math.max(1, Math.floor(rendererOptions.borderSize * horizontalPixelRatio));
			const left = side === 'left' ? bitmapSize.width - borderSize : 0;
			ctx.fillRect(left, 0, borderSize, bitmapSize.height);
		});
	}
	if (!tickMarks || tickMarks.length === 0) { return; }
	if (options.borderVisible && options.ticksVisible) {
		target.useBitmapCoordinateSpace(({ context, horizontalPixelRatio, verticalPixelRatio, bitmapSize }: UniversalBitmapScope) => {
			const ctx = context as CanvasRenderingContext2D;
			ctx.fillStyle = options.borderColor;
			const tickHeight = Math.max(1, Math.floor(verticalPixelRatio));
			const tickOffset = Math.floor(verticalPixelRatio * 0.5);
			const tickLength = Math.round(rendererOptions.tickLength * horizontalPixelRatio);
			const tickMarkLeftX = side === 'left'
                ? (bitmapSize.width - Math.round(rendererOptions.tickLength * horizontalPixelRatio))
                : 0;
			ctx.beginPath();
			for (const tm of tickMarks) {
				ctx.rect(
                    Math.floor(tickMarkLeftX),
                    Math.round(tm.coord * verticalPixelRatio) - tickOffset,
                    tickLength,
                    tickHeight
                );
			}
			ctx.fill();
		});
	}
}

