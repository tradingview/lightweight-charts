import {
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	PaneRendererCustomData,
	WhitespaceData,
	Time,
} from 'lightweight-charts';
import { DualRangeHistogramSeriesOptions, defaultOptions } from './options';
import { DualRangeHistogramSeriesRenderer } from './renderer';
import { DualRangeHistogramData } from './data';

export class DualRangeHistogramSeries<TData extends DualRangeHistogramData>
	implements ICustomSeriesPaneView<Time, TData, DualRangeHistogramSeriesOptions>
{
	_renderer: DualRangeHistogramSeriesRenderer<TData>;

	constructor() {
		this._renderer = new DualRangeHistogramSeriesRenderer();
	}

	priceValueBuilder(): CustomSeriesPricePlotValues {
		return [0]; // keep zero line in view with autoscaling
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return !Boolean((data as Partial<TData>).values?.length);
	}

	renderer(): DualRangeHistogramSeriesRenderer<TData> {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: DualRangeHistogramSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}
