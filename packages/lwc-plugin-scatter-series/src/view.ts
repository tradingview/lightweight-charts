import {
	CustomConflationContext,
	CustomSeriesOptions,
	CustomSeriesPricePlotValues,
	CustomSeriesWhitespaceData,
	ICustomSeriesPaneRenderer,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
} from 'lightweight-charts';

import type { ScatterSlotData } from './data';
import { underlyingSeriesDefaults } from './options';
import { ScatterRenderState, ScatterSeriesRenderer } from './renderer';

/**
 * The custom series view behind a scatter series. Its data is the slot grid
 * of the X axis: a slot holding points reports their vertical extent, which
 * the price scale autoscales on and which gives it a first value (so price
 * labels appear); an empty slot is whitespace but still a point of the time
 * scale. The points themselves are drawn by the renderer from the model.
 */
export class ScatterSeriesView implements ICustomSeriesPaneView<number, ScatterSlotData, CustomSeriesOptions> {
	private readonly _renderer: ScatterSeriesRenderer;

	public constructor(state: ScatterRenderState) {
		this._renderer = new ScatterSeriesRenderer(state);
	}

	public renderer(): ICustomSeriesPaneRenderer {
		return this._renderer;
	}

	public update(
		_data: PaneRendererCustomData<number, ScatterSlotData>,
		_options: CustomSeriesOptions
	): void {
		// The renderer reads everything it needs from the series state.
	}

	public priceValueBuilder(plotRow: ScatterSlotData): CustomSeriesPricePlotValues {
		return [plotRow.yMin, plotRow.yMax];
	}

	public isWhitespace(
		data: ScatterSlotData | CustomSeriesWhitespaceData<number>
	): data is CustomSeriesWhitespaceData<number> {
		return typeof (data as Partial<ScatterSlotData>).yMin !== 'number';
	}

	public defaultOptions(): CustomSeriesOptions {
		return underlyingSeriesDefaults;
	}

	/** Merges two slots into their common extent, should the chart conflate them. */
	public conflationReducer(
		item1: CustomConflationContext<number, ScatterSlotData>,
		item2: CustomConflationContext<number, ScatterSlotData>
	): ScatterSlotData {
		return {
			...item1.data,
			yMin: Math.min(item1.data.yMin, item2.data.yMin),
			yMax: Math.max(item1.data.yMax, item2.data.yMax),
		};
	}
}
