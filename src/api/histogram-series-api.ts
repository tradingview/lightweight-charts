import { clone, DeepPartial } from '../helpers/strict-type-checks';

import { Palette } from '../model/palette';
import { Series } from '../model/series';
import { HistogramSeriesOptions } from '../model/series-options';

import { HistogramData, IHistogramSeriesApi } from './ihistogram-series-api';
import { DataUpdatesConsumer, SeriesApiBase } from './series-api-base';

function generatePalette(points: HistogramData[], defaultColor: string): Palette {
	const res = new Palette();
	res.add(0, defaultColor);
	let index = 1;
	points.forEach((point: HistogramData) => {
		if (point.color !== undefined && !res.hasColor(point.color)) {
			res.add(index++, point.color);
		}
	});
	return res;
}

export class HistogramSeriesApi extends SeriesApiBase<'Histogram'> implements IHistogramSeriesApi {
	public constructor(series: Series<'Histogram'>, dataUpdatesConsumer: DataUpdatesConsumer<'Histogram'>) {
		super(series, dataUpdatesConsumer);
	}

	public applyOptions(options: DeepPartial<HistogramSeriesOptions>): void {
		this._series.applyOptions(options);
	}

	public options(): HistogramSeriesOptions {
		return clone(this._series.options());
	}

	public setData(data: HistogramData[]): void {
		const palette = generatePalette(data, this._series.options().color);
		this._dataUpdatesConsumer.applyNewData(this._series, data, palette);
	}

	public update(bar: HistogramData): void {
		this._dataUpdatesConsumer.updateData(this._series, bar);
	}
}
