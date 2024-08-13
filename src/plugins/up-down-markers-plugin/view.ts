import { ISeriesApi } from '../../api/iseries-api';
import { ITimeScaleApi } from '../../api/itime-scale-api';

import { ensureNotNull } from '../../helpers/assertions';
import { notNull } from '../../helpers/strict-type-checks';

import { IPrimitivePaneView } from '../../model/ipane-primitive';
import {
	AreaSeriesOptions,
	LineSeriesOptions,
	SeriesOptionsMap,
} from '../../model/series-options';

import { UpDownMarkersPluginOptions } from './options';
import { MarkersPrimitiveRenderer } from './renderer';
import {
	MarkerCoordinates,
	SeriesUpDownMarker,
	UpDownMarkersSupportedSeriesTypes,
} from './types';

function isAreaStyleOptions(opts: SupportedSeriesOptions, seriesType: UpDownMarkersSupportedSeriesTypes): opts is AreaSeriesOptions {
	return seriesType === 'Area';
}

function getNeutralColor<TSeriesType extends UpDownMarkersSupportedSeriesTypes>(opts: LineSeriesOptions | AreaSeriesOptions, seriesType: TSeriesType): string {
	if (isAreaStyleOptions(opts, seriesType)) {
		return opts.lineColor;
	}
	return opts.color;
}

type SupportedSeriesOptions = SeriesOptionsMap[UpDownMarkersSupportedSeriesTypes];

export class MarkersPrimitivePaneView<
	HorzScaleItem,
	TSeriesType extends UpDownMarkersSupportedSeriesTypes
> implements IPrimitivePaneView {
	private readonly _series: ISeriesApi<UpDownMarkersSupportedSeriesTypes, HorzScaleItem>;
	private readonly _timeScale: ITimeScaleApi<HorzScaleItem>;
	private readonly _options: UpDownMarkersPluginOptions;
	private _data: MarkerCoordinates[] = [];

	public constructor(
		series: ISeriesApi<TSeriesType, HorzScaleItem>,
		timeScale: ITimeScaleApi<HorzScaleItem>,
		options: UpDownMarkersPluginOptions
	) {
		this._series = series;
		this._timeScale = timeScale;
		this._options = options;
	}

	public update(markers: readonly SeriesUpDownMarker<HorzScaleItem>[]): void {
		this._data = markers.map((marker: SeriesUpDownMarker<HorzScaleItem>) => {
			const y = this._series.priceToCoordinate(marker.value);
			if (y === null) {
				return null;
			}
			const x = ensureNotNull(
				this._timeScale.timeToCoordinate(marker.time)
			);
			return {
				x,
				y,
				sign: marker.sign,
			};
		})
		.filter(notNull);
	}

	public renderer(): MarkersPrimitiveRenderer {
		const options = this._series.options();
		const seriesType = this._series.seriesType();
		const neutralColor = getNeutralColor(options, seriesType);
		return new MarkersPrimitiveRenderer(
			this._data,
			neutralColor,
			this._options.negativeColor,
			this._options.positiveColor
		);
	}
}
