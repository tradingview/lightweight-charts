"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CandlestickSeriesApi = void 0;
const series_options_1 = require("../model/series-options");
const series_api_1 = require("./series-api");
class CandlestickSeriesApi extends series_api_1.SeriesApi {
    applyOptions(options) {
        (0, series_options_1.fillUpDownCandlesticksColors)(options);
        super.applyOptions(options);
    }
}
exports.CandlestickSeriesApi = CandlestickSeriesApi;
