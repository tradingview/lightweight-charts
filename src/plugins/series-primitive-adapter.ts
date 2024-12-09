import { ISeriesApi } from '../api/iseries-api';
import { ISeriesPrimitive } from '../api/iseries-primitive-api';

import { DeepPartial } from '../helpers/strict-type-checks';

import { SeriesType } from '../model/series-options';
/**
 * Interface for a primitive wrapper. It must be implemented to add some plugin to the chart.
 */
interface ISeriesPrimitiveWithOptions<T, Options = unknown> extends ISeriesPrimitive<T> {
	/**
	 * @param options - Options to apply. The options are deeply merged with the current options.
	 */
	applyOptions?: (options: DeepPartial<Options>) => void;
}

/**
 * Interface for a series primitive.
 */
export interface ISeriesPrimitiveWrapper<T, Options = unknown> {
	/**
	 * Detaches the plugin from the series.
	 */
	detach: () => void;
	/**
	 * Returns the current series.
	 */
	getSeries: () => ISeriesApi<SeriesType, T>;
	/**
	 * Applies options to the primitive.
	 * @param options - Options to apply. The options are deeply merged with the current options.
	 */
	applyOptions?: (options: DeepPartial<Options>) => void;
}

export class SeriesPrimitiveAdapter<T, Options = unknown, IPrimitive extends ISeriesPrimitiveWithOptions<T, Options> = ISeriesPrimitiveWithOptions<T, Options>, TSeriesType extends SeriesType = SeriesType> implements ISeriesPrimitiveWrapper<T, Options> {
	protected _primitive: IPrimitive;
	protected _series: ISeriesApi<TSeriesType, T>;

	public constructor(series: ISeriesApi<TSeriesType, T>, primitive: IPrimitive) {
		this._series = series;
		this._primitive = primitive;
		this._attach();
	}

	public detach(): void {
		this._series.detachPrimitive(this._primitive);
	}

	public getSeries(): ISeriesApi<TSeriesType, T> {
		return this._series;
	}

	public applyOptions(options: DeepPartial<Options>): void {
		if (this._primitive && this._primitive.applyOptions) {
			this._primitive.applyOptions(options);
		}
	}

	private _attach(): void {
		this._series.attachPrimitive(this._primitive);
	}
}
