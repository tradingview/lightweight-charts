export interface LogicalScaleApi<HorzScaleItem> {
	logicalToCoordinate(logical: Logical): number | null;
	coordinateToLogical(x: number): Logical | null;
}

import type { Logical } from '../model/time-data';

import type { IWebGLPaneContext } from './types';

export function hitTestLine<HorzScaleItem>(args: {
	bestIdx: number;
	targetLogical: number;
	x: number;
	y: number;
	thresholdPx: number;
	ts: LogicalScaleApi<HorzScaleItem>;
	ctx: IWebGLPaneContext;
	points: { logicalIndex: number; price: number }[];
	instanceId: string;
}): { externalId: string; zOrder: 'normal' } | null {
	const { bestIdx, targetLogical, x, y, thresholdPx, ts, ctx, points, instanceId } = args;
	const p1 = points[bestIdx];
	const usePrev = bestIdx > 0;
	const p0 = usePrev ? points[bestIdx - 1] : p1;
	const l0 = Math.floor(p0.logicalIndex) as unknown as Logical;
	const l1 = Math.floor(p1.logicalIndex) as unknown as Logical;
	const x0 = ts.logicalToCoordinate(l0);
	const x1 = ts.logicalToCoordinate(l1);
	const y0 = ctx.priceToY(p0.price);
	const y1 = ctx.priceToY(p1.price);
	if (x0 == null || x1 == null || y0 == null || y1 == null) {
		// fallback to horizontal proximity by logical distance
		const c0 = ts.logicalToCoordinate(Math.floor(points[bestIdx].logicalIndex) as unknown as Logical);
		const c1 = ts.logicalToCoordinate(Math.floor(points[bestIdx].logicalIndex + 1) as unknown as Logical);
		const pxPerIndex = (c0 != null && c1 != null) ? Math.abs(c1 - c0) : 10;
		const dxPx = Math.abs((targetLogical - p1.logicalIndex) * pxPerIndex);
		return dxPx <= thresholdPx ? { externalId: `gl-series:${instanceId}:line:${bestIdx}`, zOrder: 'normal' } : null;
	}
	// distance from point to segment
	const segDx = x1 - x0;
	const segDy = y1 - y0;
	const len2 = segDx * segDx + segDy * segDy;
	let t = 0;
	if (len2 > 0) {
		t = ((x - x0) * segDx + (y - y0) * segDy) / len2;
		t = Math.max(0, Math.min(1, t));
	}
	const projX = x0 + t * segDx;
	const projY = y0 + t * segDy;
	const dist = Math.hypot(x - projX, y - projY);
	return dist <= thresholdPx ? { externalId: `gl-series:${instanceId}:line:${bestIdx}`, zOrder: 'normal' } : null;
}

export function hitTestCandle<HorzScaleItem>(args: {
	bestIdx: number;
	l0: number;
	x: number;
	y: number;
	thresholdPx: number;
	ts: LogicalScaleApi<HorzScaleItem>;
	ctx: IWebGLPaneContext;
	candles: { open: number; high: number; low: number; close: number }[];
	instanceId: string;
}): { externalId: string; zOrder: 'normal' } | null {
	const { bestIdx, l0, x, y, thresholdPx, ts, ctx, candles, instanceId } = args;
	if (bestIdx >= candles.length) { return null; }
	const candle = candles[bestIdx];
	const xCenter = ts.logicalToCoordinate(l0 as unknown as Logical);
	if (xCenter == null) { return null; }
	const yOpen = ctx.priceToY(candle.open);
	const yClose = ctx.priceToY(candle.close);
	const yHigh = ctx.priceToY(candle.high);
	const yLow = ctx.priceToY(candle.low);
	if (yOpen == null || yClose == null || yHigh == null || yLow == null) { return null; }
	// estimate bar width from time scale spacing
	const c0 = ts.logicalToCoordinate(l0 as unknown as Logical);
	const c1 = ts.logicalToCoordinate((l0 + 1) as unknown as Logical);
	const pxPerIndex = (c0 != null && c1 != null) ? Math.abs(c1 - c0) : 10;
	const widthPx = Math.max(2, Math.floor(pxPerIndex));
	const left = xCenter - widthPx * 0.5;
	const right = xCenter + widthPx * 0.5;
	const top = Math.min(yOpen, yClose);
	const bottom = Math.max(yOpen, yClose);
	if (x >= left && x <= right && y >= top && y <= bottom) {
		return { externalId: `gl-series:${instanceId}:candle:${bestIdx}`, zOrder: 'normal' };
	}
	// Wick proximity (vertical segment at center)
	const yTop = Math.min(yHigh, yLow);
	const yBot = Math.max(yHigh, yLow);
	const dx = Math.abs(x - xCenter);
	if (dx <= thresholdPx && y >= yTop - thresholdPx && y <= yBot + thresholdPx) {
		return { externalId: `gl-series:${instanceId}:wick:${bestIdx}`, zOrder: 'normal' };
	}
	return null;
}

