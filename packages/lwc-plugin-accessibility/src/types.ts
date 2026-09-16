import { ISeriesApi, SeriesDataItemTypeMap, SeriesType, Time } from 'lightweight-charts';

/** A series of any type attached to the pane. */
export type AnySeries = ISeriesApi<SeriesType, Time>;

/**
 * The union of every data item a series can return (line, area, candlestick,
 * bar, histogram, whitespace, …) – exactly what {@link ISeriesApi.data} yields
 * for a series of unknown type.
 */
export type SeriesDataPoint = SeriesDataItemTypeMap<Time>[SeriesType];
