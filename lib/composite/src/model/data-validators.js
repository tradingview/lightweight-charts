"use strict";
/// <reference types="_build-time-constants" />
Object.defineProperty(exports, "__esModule", { value: true });
exports.getChecker = exports.checkSeriesValuesType = exports.checkItemsAreOrdered = exports.checkPriceLineOptions = void 0;
const assertions_1 = require("../helpers/assertions");
const data_consumer_1 = require("./data-consumer");
function checkPriceLineOptions(options) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    // eslint-disable-next-line @typescript-eslint/tslint/config
    (0, assertions_1.assert)(typeof options.price === 'number', `the type of 'price' price line's property must be a number, got '${typeof options.price}'`);
}
exports.checkPriceLineOptions = checkPriceLineOptions;
function checkItemsAreOrdered(data, bh, allowDuplicates = false) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    if (data.length === 0) {
        return;
    }
    let prevTime = bh.key(data[0].time);
    for (let i = 1; i < data.length; ++i) {
        const currentTime = bh.key(data[i].time);
        const checkResult = allowDuplicates ? prevTime <= currentTime : prevTime < currentTime;
        (0, assertions_1.assert)(checkResult, `data must be asc ordered by time, index=${i}, time=${currentTime}, prev time=${prevTime}`);
        prevTime = currentTime;
    }
}
exports.checkItemsAreOrdered = checkItemsAreOrdered;
function checkSeriesValuesType(type, data) {
    if (process.env.NODE_ENV === 'production') {
        return;
    }
    data.forEach(getChecker(type));
}
exports.checkSeriesValuesType = checkSeriesValuesType;
function getChecker(type) {
    switch (type) {
        case 'Bar':
        case 'Candlestick':
            return checkBarItem.bind(null, type);
        case 'Area':
        case 'Baseline':
        case 'Line':
        case 'Histogram':
            return checkLineItem.bind(null, type);
        case 'Custom':
            return checkCustomItem.bind(null, type);
    }
}
exports.getChecker = getChecker;
function checkBarItem(type, barItem) {
    if (!(0, data_consumer_1.isFulfilledData)(barItem)) {
        return;
    }
    (0, assertions_1.assert)(
    // eslint-disable-next-line @typescript-eslint/tslint/config
    typeof barItem.open === 'number', `${type} series item data value of open must be a number, got=${typeof barItem.open}, value=${barItem.open}`);
    (0, assertions_1.assert)(
    // eslint-disable-next-line @typescript-eslint/tslint/config
    typeof barItem.high === 'number', `${type} series item data value of high must be a number, got=${typeof barItem.high}, value=${barItem.high}`);
    (0, assertions_1.assert)(
    // eslint-disable-next-line @typescript-eslint/tslint/config
    typeof barItem.low === 'number', `${type} series item data value of low must be a number, got=${typeof barItem.low}, value=${barItem.low}`);
    (0, assertions_1.assert)(
    // eslint-disable-next-line @typescript-eslint/tslint/config
    typeof barItem.close === 'number', `${type} series item data value of close must be a number, got=${typeof barItem.close}, value=${barItem.close}`);
}
function checkLineItem(type, lineItem) {
    if (!(0, data_consumer_1.isFulfilledData)(lineItem)) {
        return;
    }
    (0, assertions_1.assert)(
    // eslint-disable-next-line @typescript-eslint/tslint/config
    typeof lineItem.value === 'number', `${type} series item data value must be a number, got=${typeof lineItem.value}, value=${lineItem.value}`);
}
function checkCustomItem(
// type: 'Custom',
// customItem: SeriesDataItemTypeMap[typeof type]
) {
    // Nothing to check yet...
    return;
}
