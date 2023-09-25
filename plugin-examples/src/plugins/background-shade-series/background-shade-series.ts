import {
	CustomSeriesPricePlotValues,
	ICustomSeriesPaneView,
	LineData,
	PaneRendererCustomData,
	WhitespaceData,
	Time,
} from 'lightweight-charts';
import { BackgroundShadeSeriesOptions, defaultOptions } from './options';
import { BackgroundShadeSeriesRenderer } from './renderer';

export class BackgroundShadeSeries<TData extends LineData>
	implements ICustomSeriesPaneView<Time, TData, BackgroundShadeSeriesOptions>
{
	_renderer: BackgroundShadeSeriesRenderer<TData>;

	constructor() {
		this._renderer = new BackgroundShadeSeriesRenderer();
	}

	priceValueBuilder(_plotRow: TData): CustomSeriesPricePlotValues {
        // using NaN here prevents this series from affecting the price scale scaling,
        // and showing a crosshair or price line
		return [NaN];
	}

	isWhitespace(data: TData | WhitespaceData): data is WhitespaceData {
		return (data as Partial<TData>).value === undefined;
	}

	renderer(): BackgroundShadeSeriesRenderer<TData> {
		return this._renderer;
	}

	update(
		data: PaneRendererCustomData<Time, TData>,
		options: BackgroundShadeSeriesOptions
	): void {
		this._renderer.update(data, options);
	}

	defaultOptions() {
		return defaultOptions;
	}
}
