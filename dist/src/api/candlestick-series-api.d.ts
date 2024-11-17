import { CandlestickSeriesPartialOptions } from '../model/series-options';
import { SeriesApi } from './series-api';
export declare class CandlestickSeriesApi<HorzScaleItem> extends SeriesApi<'Candlestick', HorzScaleItem> {
    applyOptions(options: CandlestickSeriesPartialOptions): void;
}
