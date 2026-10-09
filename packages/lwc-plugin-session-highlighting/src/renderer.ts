import { fullBarWidth } from '@tradingview/lwc-toolkit/dimensions/full-width';
import { CanvasRenderingTarget2D } from 'fancy-canvas';
import {
	IPrimitivePaneRenderer,
	IPrimitivePaneView,
	PrimitivePaneViewZOrder,
} from 'lightweight-charts';

import { SessionHighlightingOptions } from './options.js';

/** One visible bar to shade: its center in media pixels and its color. */
export interface HighlightColumn {
	x: number;
	color: string;
}

/** Everything the pane view needs to draw the visible columns. */
export interface SessionHighlightingState {
	columns: readonly HighlightColumn[];
	/** The time scale's bar spacing, in media pixels: the width of each column. */
	barSpacing: number;
	options: SessionHighlightingOptions;
}

class SessionHighlightingPaneRenderer implements IPrimitivePaneRenderer {
	private readonly _state: SessionHighlightingState;

	public constructor(state: SessionHighlightingState) {
		this._state = state;
	}

	public draw(target: CanvasRenderingTarget2D): void {
		target.useBitmapCoordinateSpace(scope => {
			const { columns, barSpacing } = this._state;
			const ctx = scope.context;
			const height = scope.bitmapSize.height;
			const width = scope.bitmapSize.width;
			const halfSpacing = barSpacing / 2;
			ctx.save();
			for (const column of columns) {
				// Full-width columns abut exactly, so neighbouring bars neither
				// overlap nor leave a seam at any pixel ratio.
				const { position, length } = fullBarWidth(column.x, halfSpacing, scope.horizontalPixelRatio);
				if (position + length <= 0 || position >= width) {
					continue;
				}
				ctx.fillStyle = column.color;
				ctx.fillRect(position, 0, length, height);
			}
			ctx.restore();
		});
	}
}

export class SessionHighlightingPaneView implements IPrimitivePaneView {
	private _state: SessionHighlightingState;

	public constructor(state: SessionHighlightingState) {
		this._state = state;
	}

	public update(state: SessionHighlightingState): void {
		this._state = state;
	}

	public zOrder(): PrimitivePaneViewZOrder {
		return this._state.options.zOrder;
	}

	/** `null` while there is nothing to draw, so the chart skips the view. */
	public renderer(): IPrimitivePaneRenderer | null {
		const { options, columns } = this._state;
		if (!options.visible || columns.length === 0) {
			return null;
		}
		return new SessionHighlightingPaneRenderer(this._state);
	}
}
