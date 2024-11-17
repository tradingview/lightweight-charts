import { fillUpDownCandlesticksColors, } from '../model/series-options';
import { SeriesApi } from './series-api';
export class CandlestickSeriesApi extends SeriesApi {
    applyOptions(options) {
        fillUpDownCandlesticksColors(options);
        super.applyOptions(options);
    }
}
