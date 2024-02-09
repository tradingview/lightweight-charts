"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const chai_1 = require("chai");
const chai_exclude_1 = require("chai-exclude");
const mocha_1 = require("mocha");
const assertions_1 = require("../../src/helpers/assertions");
const data_layer_1 = require("../../src/model/data-layer");
const horz_scale_behavior_time_1 = require("../../src/model/horz-scale-behavior-time/horz-scale-behavior-time");
const plot_list_1 = require("../../src/model/plot-list");
chai.use(chai_exclude_1.default);
function createSeriesMock(seriesType) {
    const data = new plot_list_1.PlotList();
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
        bars: () => data,
        seriesType: () => seriesType || 'Line',
        customSeriesPlotValuesBuilder: () => { },
        customSeriesWhitespaceCheck: () => { },
    };
}
// just for tests
function dataItemAt(time) {
    return { time, value: 0, open: 0, high: 0, low: 0, close: 0 };
}
function whitespaceItemAt(time) {
    return { time };
}
const behavior = new horz_scale_behavior_time_1.HorzScaleBehaviorTime();
(0, mocha_1.describe)('DataLayer', () => {
    (0, mocha_1.it)('should be able to append new series with updating time scale', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        // actually we don't need to use Series, so we just use new Object()
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        const updateResult1 = dataLayer.setSeriesData(series1, [dataItemAt(1000), dataItemAt(3000)]);
        (0, chai_1.expect)(updateResult1.timeScale.baseIndex).to.be.equal(1);
        (0, chai_1.expect)(updateResult1.timeScale.points).excludingEvery('pointData').to.have.deep.members([
            { time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
            { time: { timestamp: 3000 }, timeWeight: 22, originalTime: 3000 },
        ]);
        (0, chai_1.expect)(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(0);
        (0, chai_1.expect)(updateResult1.series.size).to.be.equal(1);
        updateResult1.series.forEach((updatePacket, series) => {
            (0, chai_1.expect)(series).to.be.equal(series1);
            (0, chai_1.expect)(updatePacket.data.length).to.be.equal(2);
            (0, chai_1.expect)(updatePacket.data[0].index).to.be.equal(0);
            (0, chai_1.expect)(updatePacket.data[0].time.timestamp).to.be.equal(1000);
            (0, chai_1.expect)(updatePacket.data[1].index).to.be.equal(1);
            (0, chai_1.expect)(updatePacket.data[1].time.timestamp).to.be.equal(3000);
        });
        const updateResult2 = dataLayer.setSeriesData(series2, [dataItemAt(2000), dataItemAt(4000)]);
        (0, chai_1.expect)(updateResult2.timeScale.baseIndex).to.be.equal(3);
        (0, chai_1.expect)(updateResult2.timeScale.points).excludingEvery('pointData').to.have.deep.members([
            { time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
            { time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
            { time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
            { time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
        ]);
        (0, chai_1.expect)(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(1);
        (0, chai_1.expect)(updateResult2.series.size).to.be.equal(2);
        updateResult2.series.forEach((updatePacket, series) => {
            if (series === series1) {
                (0, chai_1.expect)(updatePacket.data.length).to.be.equal(2);
                (0, chai_1.expect)(updatePacket.data[0].index).to.be.equal(0);
                (0, chai_1.expect)(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 1000 });
                (0, chai_1.expect)(updatePacket.data[1].index).to.be.equal(2);
                (0, chai_1.expect)(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 3000 });
            }
            else {
                (0, chai_1.expect)(updatePacket.data[0].index).to.be.equal(1);
                (0, chai_1.expect)(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 2000 });
                (0, chai_1.expect)(updatePacket.data[1].index).to.be.equal(3);
                (0, chai_1.expect)(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 4000 });
            }
        });
    });
    (0, mocha_1.it)('should be able to append new series WITHOUT updating time scale', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        // actually we don't need to use Series, so we just use new Object()
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        dataLayer.setSeriesData(series1, [dataItemAt(1000), dataItemAt(3000)]);
        const updateResult = dataLayer.setSeriesData(series2, [dataItemAt(1000), dataItemAt(3000)]);
        (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(1);
        (0, chai_1.expect)(updateResult.timeScale.points).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
        const series2Updates = updateResult.series.get(series2);
        (0, chai_1.expect)(series2Updates).not.to.be.equal(undefined);
        (0, chai_1.expect)(series2Updates === null || series2Updates === void 0 ? void 0 : series2Updates.data.length).to.be.equal(2);
        const series2UpdatesData = (series2Updates === null || series2Updates === void 0 ? void 0 : series2Updates.data) || [];
        (0, chai_1.expect)(series2UpdatesData[0].index).to.be.equal(0);
        (0, chai_1.expect)(series2UpdatesData[0].time).to.be.deep.equal({ timestamp: 1000 });
        (0, chai_1.expect)(series2UpdatesData[1].index).to.be.equal(1);
        (0, chai_1.expect)(series2UpdatesData[1].time).to.be.deep.equal({ timestamp: 3000 });
    });
    (0, mocha_1.it)('should be able to remove series if time scale is changed', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        // actually we don't need to use Series, so we just use new Object()
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        const series3 = createSeriesMock();
        dataLayer.setSeriesData(series1, [dataItemAt(2000), dataItemAt(5000)]);
        dataLayer.setSeriesData(series2, [dataItemAt(3000), dataItemAt(7000)]);
        dataLayer.setSeriesData(series3, [dataItemAt(4000), dataItemAt(6000)]);
        const updateResult = dataLayer.removeSeries(series3);
        (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(3);
        (0, chai_1.expect)(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
            { time: { timestamp: 2000 }, timeWeight: 70, originalTime: 2000 },
            { time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
            { time: { timestamp: 5000 }, timeWeight: 30, originalTime: 5000 },
            { time: { timestamp: 7000 }, timeWeight: 22, originalTime: 7000 },
        ]);
        (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(2);
        (0, chai_1.expect)(updateResult.series.size).to.be.equal(3);
        const series1Update = updateResult.series.get(series1);
        (0, chai_1.expect)(series1Update).not.to.be.equal(undefined);
        (0, chai_1.expect)(series1Update === null || series1Update === void 0 ? void 0 : series1Update.data.length).to.be.equal(2);
        (0, chai_1.expect)(series1Update === null || series1Update === void 0 ? void 0 : series1Update.data[0].index).to.be.equal(0);
        (0, chai_1.expect)(series1Update === null || series1Update === void 0 ? void 0 : series1Update.data[0].time).to.be.deep.equal({ timestamp: 2000 });
        (0, chai_1.expect)(series1Update === null || series1Update === void 0 ? void 0 : series1Update.data[1].index).to.be.equal(2);
        (0, chai_1.expect)(series1Update === null || series1Update === void 0 ? void 0 : series1Update.data[1].time).to.be.deep.equal({ timestamp: 5000 });
        const series2Update = updateResult.series.get(series2);
        (0, chai_1.expect)(series2Update).not.to.be.equal(undefined);
        (0, chai_1.expect)(series2Update === null || series2Update === void 0 ? void 0 : series2Update.data.length).to.be.equal(2);
        (0, chai_1.expect)(series2Update === null || series2Update === void 0 ? void 0 : series2Update.data[0].index).to.be.equal(1);
        (0, chai_1.expect)(series2Update === null || series2Update === void 0 ? void 0 : series2Update.data[0].time).to.be.deep.equal({ timestamp: 3000 });
        (0, chai_1.expect)(series2Update === null || series2Update === void 0 ? void 0 : series2Update.data[1].index).to.be.equal(3);
        (0, chai_1.expect)(series2Update === null || series2Update === void 0 ? void 0 : series2Update.data[1].time).to.be.deep.equal({ timestamp: 7000 });
        const series3Update = updateResult.series.get(series3);
        (0, chai_1.expect)(series3Update).not.to.be.equal(undefined);
        (0, chai_1.expect)(series3Update === null || series3Update === void 0 ? void 0 : series3Update.data.length).to.be.equal(0);
    });
    (0, mocha_1.it)('should be able to remove series if time scale is NOT changed', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        // actually we don't need to use Series, so we just use new Object()
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        const series3 = createSeriesMock();
        dataLayer.setSeriesData(series1, [dataItemAt(2000), dataItemAt(5000)]);
        dataLayer.setSeriesData(series2, [dataItemAt(3000), dataItemAt(7000)]);
        dataLayer.setSeriesData(series3, [dataItemAt(2000), dataItemAt(7000)]);
        const updateResult = dataLayer.removeSeries(series3);
        (0, chai_1.expect)(updateResult.timeScale.points).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(3);
        (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
        const series3Updates = updateResult.series.get(series3);
        (0, chai_1.expect)(series3Updates).not.to.be.equal(undefined);
        (0, chai_1.expect)(series3Updates === null || series3Updates === void 0 ? void 0 : series3Updates.data.length).to.be.equal(0);
    });
    (0, mocha_1.it)('should be able to add new point in the end', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        // actually we don't need to use Series, so we just use new Object()
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        dataLayer.setSeriesData(series1, [dataItemAt(1000), dataItemAt(3000)]);
        dataLayer.setSeriesData(series2, [dataItemAt(2000), dataItemAt(4000)]);
        // add a new point
        const updateResult1 = dataLayer.updateSeriesData(series1, dataItemAt(5000));
        (0, chai_1.expect)(updateResult1.timeScale.baseIndex).to.be.equal(4);
        (0, chai_1.expect)(updateResult1.timeScale.points).excludingEvery('pointData').to.have.deep.members([
            { time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
            { time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
            { time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
            { time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
            { time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
        ]);
        (0, chai_1.expect)(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(4);
        /* TODO: uncomment after make perf improvements in data layer
        expect(updateResult1.series.size).to.be.equal(1);
        updateResult1.series.forEach((updatePacket: SeriesChanges, series: Series) => {
            expect(series).to.be.equal(series1);
            expect(updatePacket.data.length).to.be.equal(1);
            expect(updatePacket.data[0].index).to.be.equal(4 as TimePointIndex);
            expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 5000 });
        });
        */
        // add one more point
        const updateResult2 = dataLayer.updateSeriesData(series2, dataItemAt(6000));
        (0, chai_1.expect)(updateResult2.timeScale.baseIndex).to.be.equal(5);
        (0, chai_1.expect)(updateResult2.timeScale.points).excludingEvery('pointData').to.have.deep.members([
            { time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
            { time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
            { time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
            { time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
            { time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
            { time: { timestamp: 6000 }, timeWeight: 22, originalTime: 6000 },
        ]);
        (0, chai_1.expect)(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(5);
        /* TODO: uncomment after make perf improvements in data layer
        expect(updateResult2.series.size).to.be.equal(1);
        updateResult2.series.forEach((updatePacket: SeriesChanges, series: Series) => {
            expect(series).to.be.equal(series2);
            expect(updatePacket.data.length).to.be.equal(1);
            expect(updatePacket.data[0].index).to.be.equal(5 as TimePointIndex);
            expect(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 6000 });
        });
        */
    });
    (0, mocha_1.it)('should be able to change last existing point', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        // actually we don't need to use Series, so we just use new Object()
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        dataLayer.setSeriesData(series1, [dataItemAt(1000), dataItemAt(4000)]);
        dataLayer.setSeriesData(series2, [dataItemAt(2000), dataItemAt(4000)]);
        // change the last point of the first series
        const updateResult1 = dataLayer.updateSeriesData(series1, dataItemAt(4000));
        (0, chai_1.expect)(updateResult1.timeScale.baseIndex).to.be.equal(2);
        (0, chai_1.expect)(updateResult1.timeScale.points).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult1.series.size).to.be.equal(1);
        updateResult1.series.forEach((updatePacket, series) => {
            (0, chai_1.expect)(series).to.be.equal(series1);
            (0, chai_1.expect)(updatePacket.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
                { index: 0, time: { timestamp: 1000 } },
                { index: 2, time: { timestamp: 4000 } },
            ]);
        });
        // change the last point of the second series
        const updateResult2 = dataLayer.updateSeriesData(series2, dataItemAt(4000));
        (0, chai_1.expect)(updateResult2.timeScale.baseIndex).to.be.equal(2);
        (0, chai_1.expect)(updateResult2.timeScale.points).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult2.series.size).to.be.equal(1);
        updateResult2.series.forEach((updatePacket, series) => {
            (0, chai_1.expect)(series).to.be.equal(series2);
            (0, chai_1.expect)(updatePacket.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
                { index: 1, time: { timestamp: 2000 } },
                { index: 2, time: { timestamp: 4000 } },
            ]);
        });
    });
    (0, mocha_1.it)('should be able to add new point in the middle', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        // actually we don't need to use Series, so we just use new Object()
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        dataLayer.setSeriesData(series1, [dataItemAt(5000), dataItemAt(6000)]);
        dataLayer.setSeriesData(series2, [dataItemAt(2000), dataItemAt(3000)]);
        // add a new point in the end of one series but not in the end of all points
        const updateResult = dataLayer.updateSeriesData(series2, dataItemAt(4000));
        (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(4);
        (0, chai_1.expect)(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
            { time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
            { time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
            { time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
            { time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
            { time: { timestamp: 6000 }, timeWeight: 22, originalTime: 6000 },
        ]);
        (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(2);
        (0, chai_1.expect)(updateResult.series.size).to.be.equal(2);
        updateResult.series.forEach((updatePacket, series) => {
            if (series === series1) {
                (0, chai_1.expect)(updatePacket.data.length).to.be.equal(2);
                (0, chai_1.expect)(updatePacket.data[0].index).to.be.equal(3);
                (0, chai_1.expect)(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 5000 });
                (0, chai_1.expect)(updatePacket.data[1].index).to.be.equal(4);
                (0, chai_1.expect)(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 6000 });
            }
            else {
                (0, chai_1.expect)(updatePacket.data.length).to.be.equal(3);
                (0, chai_1.expect)(updatePacket.data[0].index).to.be.equal(0);
                (0, chai_1.expect)(updatePacket.data[0].time).to.be.deep.equal({ timestamp: 2000 });
                (0, chai_1.expect)(updatePacket.data[1].index).to.be.equal(1);
                (0, chai_1.expect)(updatePacket.data[1].time).to.be.deep.equal({ timestamp: 3000 });
                (0, chai_1.expect)(updatePacket.data[2].index).to.be.equal(2);
                (0, chai_1.expect)(updatePacket.data[2].time).to.be.deep.equal({ timestamp: 4000 });
            }
        });
    });
    (0, mocha_1.it)('allow business days', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        const series1 = createSeriesMock();
        const date1 = { day: 1, month: 10, year: 2019 };
        const date2 = { day: 2, month: 10, year: 2019 };
        const updateResult1 = dataLayer.setSeriesData(series1, [dataItemAt(date1), dataItemAt(date2)]);
        (0, chai_1.expect)(updateResult1.timeScale.baseIndex).to.be.equal(1);
        const timePoint1 = {
            businessDay: {
                day: 1,
                month: 10,
                year: 2019,
            },
            timestamp: 1569888000,
        };
        const timePoint2 = {
            businessDay: {
                day: 2,
                month: 10,
                year: 2019,
            },
            timestamp: 1569974400,
        };
        (0, chai_1.expect)(updateResult1.timeScale.points).excludingEvery('pointData').to.have.deep.members([
            { time: timePoint1, timeWeight: 60, originalTime: { day: 1, month: 10, year: 2019 } },
            { time: timePoint2, timeWeight: 50, originalTime: { day: 2, month: 10, year: 2019 } },
        ]);
        (0, chai_1.expect)(updateResult1.series.size).to.be.equal(1);
        updateResult1.series.forEach((updatePacket, series) => {
            (0, chai_1.expect)(series).to.be.equal(series);
            (0, chai_1.expect)(updatePacket.data.length).to.be.equal(2);
            (0, chai_1.expect)(updatePacket.data[0].index).to.be.equal(0);
            (0, chai_1.expect)(updatePacket.data[0].time.timestamp).to.be.equal(1569888000);
            (0, chai_1.expect)(updatePacket.data[1].index).to.be.equal(1);
            (0, chai_1.expect)(updatePacket.data[1].time.timestamp).to.be.equal(1569974400);
        });
    });
    (0, mocha_1.it)('all points should have same time type', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        const series = createSeriesMock();
        (0, chai_1.expect)(() => dataLayer.setSeriesData(series, [dataItemAt(5000), dataItemAt({ day: 1, month: 10, year: 2019 })]))
            .to.throw();
    });
    (0, mocha_1.it)('all points should have same time type on updating', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        const series = createSeriesMock();
        dataLayer.setSeriesData(series, [dataItemAt({ day: 1, month: 10, year: 2019 })]);
        (0, chai_1.expect)(() => dataLayer.updateSeriesData(series, dataItemAt(5000)))
            .to.throw();
    });
    (0, mocha_1.it)('convertTime', () => {
        (0, chai_1.expect)((0, horz_scale_behavior_time_1.convertTime)(1554792010)).to.be.deep.equal({ timestamp: 1554792010 });
        const bd = { day: 1, month: 10, year: 2018 };
        (0, chai_1.expect)((0, horz_scale_behavior_time_1.convertTime)(bd)).to.be.deep.equal({ timestamp: 1538352000, businessDay: bd });
    });
    (0, mocha_1.it)('stringToBusinessDay', () => {
        (0, chai_1.expect)((0, horz_scale_behavior_time_1.stringToBusinessDay)('2019-05-01')).to.be.deep.equal({ day: 1, month: 5, year: 2019 });
        (0, chai_1.expect)(() => (0, horz_scale_behavior_time_1.stringToBusinessDay)('2019-15-01')).to.throw();
    });
    (0, mocha_1.it)('stringToBusinessDay', () => {
        (0, chai_1.expect)((0, horz_scale_behavior_time_1.stringToBusinessDay)('2019-05-01')).to.be.deep.equal({ day: 1, month: 5, year: 2019 });
        (0, chai_1.expect)(() => (0, horz_scale_behavior_time_1.stringToBusinessDay)('2019-15-01')).to.throw();
    });
    (0, mocha_1.it)('should ignore "value" fields on OHLC-based series update', () => {
        const ohlcBasedTypes = ['Bar', 'Candlestick'];
        for (const seriesType of ohlcBasedTypes) {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = createSeriesMock(seriesType);
            const item = {
                time: '2017-01-01',
                open: 10,
                high: 15,
                low: 5,
                close: 11,
                value: 100,
            };
            const packet = dataLayer.setSeriesData(series, [item]);
            const update = (0, assertions_1.ensureDefined)(packet.series.get(series));
            (0, chai_1.expect)(update.data[0].value[0 /* PlotRowValueIndex.Open */]).to.be.equal(item.open);
            (0, chai_1.expect)(update.data[0].value[1 /* PlotRowValueIndex.High */]).to.be.equal(item.high);
            (0, chai_1.expect)(update.data[0].value[2 /* PlotRowValueIndex.Low */]).to.be.equal(item.low);
            (0, chai_1.expect)(update.data[0].value[3 /* PlotRowValueIndex.Close */]).to.be.equal(item.close);
        }
    });
    (0, mocha_1.it)('should update removed series data gh#752', () => {
        var _a, _b, _c, _d, _e, _f;
        function generateData() {
            const res = [];
            const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
            for (let i = 0; i < 10; ++i) {
                const timestamp = time.getTime() / 1000;
                res.push(dataItemAt(timestamp));
                time.setUTCDate(time.getUTCDate() + 1);
            }
            return res;
        }
        const dataLayer = new data_layer_1.DataLayer(behavior);
        const series1 = createSeriesMock();
        const series2 = createSeriesMock();
        const data1 = generateData();
        const data2 = generateData();
        dataLayer.setSeriesData(series1, data1);
        dataLayer.setSeriesData(series2, data2);
        const updateResult1 = dataLayer.setSeriesData(series1, []);
        (0, chai_1.expect)(updateResult1.timeScale.baseIndex).to.be.equal(9, 'expected base index to be 9');
        (0, chai_1.expect)(updateResult1.timeScale.points).to.be.equal(undefined, 'expected updated time scale points to be undefined');
        (0, chai_1.expect)(updateResult1.timeScale.firstChangedPointIndex).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult1.series.has(series1)).to.be.equal(true, 'expected to contain series1');
        (0, chai_1.expect)((_a = updateResult1.series.get(series1)) === null || _a === void 0 ? void 0 : _a.data.length).to.be.equal(0, 'expected series1 data to be empty');
        const updateResult2 = dataLayer.setSeriesData(series2, []);
        (0, chai_1.expect)(updateResult2.timeScale.baseIndex).to.be.equal(null, 'expected base index to be null');
        (0, chai_1.expect)((_b = updateResult2.timeScale.points) === null || _b === void 0 ? void 0 : _b.length).to.be.equal(0, 'expected updated time scale points length to equal 0');
        (0, chai_1.expect)(updateResult2.timeScale.firstChangedPointIndex).to.be.equal(0);
        (0, chai_1.expect)(updateResult2.series.has(series2)).to.be.equal(true, 'expected to contain series2');
        (0, chai_1.expect)((_c = updateResult2.series.get(series2)) === null || _c === void 0 ? void 0 : _c.data.length).to.be.equal(0, 'expected series2 data to be empty');
        const updateResult3 = dataLayer.setSeriesData(series1, data1);
        (0, chai_1.expect)(updateResult3.timeScale.baseIndex).to.be.equal(9, 'expected base index to be 9');
        (0, chai_1.expect)((_d = updateResult3.timeScale.points) === null || _d === void 0 ? void 0 : _d.length).to.be.equal(10, 'expected updated time scale points length to equal 10');
        (0, chai_1.expect)(updateResult3.timeScale.firstChangedPointIndex).to.be.equal(0);
        (0, chai_1.expect)(updateResult3.series.has(series1)).to.be.equal(true, 'expected to contain series1');
        (0, chai_1.expect)((_e = updateResult3.series.get(series1)) === null || _e === void 0 ? void 0 : _e.data.length).to.be.equal(data1.length, 'expected series1 data to be non-empty');
        const updateResult4 = dataLayer.setSeriesData(series2, data2);
        (0, chai_1.expect)(updateResult4.timeScale.baseIndex).to.be.equal(9, 'expected base index to be 9');
        (0, chai_1.expect)(updateResult4.timeScale.points).to.be.equal(undefined, 'expected updated time scale points to be undefined');
        (0, chai_1.expect)(updateResult4.timeScale.firstChangedPointIndex).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult4.series.has(series2)).to.be.equal(true, 'expected to contain series2');
        (0, chai_1.expect)((_f = updateResult4.series.get(series2)) === null || _f === void 0 ? void 0 : _f.data.length).to.be.equal(data2.length, 'expected series1 data to be non-empty');
    });
    (0, mocha_1.it)('should correctly update indexes of series data if times are not changed', () => {
        const dataLayer = new data_layer_1.DataLayer(behavior);
        const series = createSeriesMock();
        dataLayer.setSeriesData(series, [dataItemAt(1000), dataItemAt(3000)]);
        const updateResult = dataLayer.setSeriesData(series, [dataItemAt(1000), dataItemAt(3000)]);
        (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(1);
        (0, chai_1.expect)(updateResult.timeScale.points).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
        (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
        const seriesUpdate = updateResult.series.get(series);
        (0, chai_1.expect)(seriesUpdate).not.to.be.equal(undefined);
        (0, chai_1.expect)(seriesUpdate === null || seriesUpdate === void 0 ? void 0 : seriesUpdate.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
            { index: 0, time: { timestamp: 1000 } },
            { index: 1, time: { timestamp: 3000 } },
        ]);
    });
    (0, mocha_1.describe)('should update base index to null when all series data is cleared gh#757', () => {
        const data = [
            {
                time: 1609459200,
                value: 31.533026412262345,
            },
            {
                time: 1609545600,
                value: 6.568118452269189,
            },
            {
                time: 1609632000,
                value: 98.62539451897008,
            },
            {
                time: 1609718400,
                value: 46.767718860541606,
            },
            {
                time: 1609804800,
                value: 36.955748002496655,
            },
            {
                time: 1609891200,
                value: 85.96192548047124,
            },
            {
                time: 1609977600,
                value: 72.75990512152876,
            },
            {
                time: 1610064000,
                value: 2.993469032310503,
            },
            {
                time: 1610150400,
                value: 4.258319318756176,
            },
            {
                time: 1610236800,
                value: 60.0150296893859,
            },
        ];
        (0, mocha_1.it)('single series', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = createSeriesMock();
            dataLayer.setSeriesData(series, data);
            const updateResult = dataLayer.setSeriesData(series, []);
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(null);
        });
        (0, mocha_1.it)('multiple series', () => {
            const seriesCount = 5;
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = [];
            for (let i = 0; i < seriesCount; i++) {
                series[i] = createSeriesMock();
                dataLayer.setSeriesData(series[i], data);
            }
            for (let i = 0; i < series.length; i++) {
                const updateResult = dataLayer.setSeriesData(series[i], []);
                if (i === series.length - 1) {
                    // the last series was cleared so we expect a null base index
                    (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(null);
                }
                else {
                    // some series still have data so we expected a non-null base index
                    (0, chai_1.expect)(updateResult.timeScale.baseIndex).not.to.be.equal(null);
                }
            }
        });
    });
    (0, mocha_1.describe)('should be able to remove series and generate full update to other series if time scale is changed gh#355', () => {
        const barsCount = 10;
        function generateData(startTime, step) {
            const res = [];
            let time = startTime;
            for (let i = 0; i < barsCount; ++i) {
                res.push(dataItemAt(time));
                time += step;
            }
            return res;
        }
        (0, mocha_1.it)('remove first series', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series1 = createSeriesMock();
            const series2 = createSeriesMock();
            dataLayer.setSeriesData(series1, generateData(1, 3));
            dataLayer.setSeriesData(series2, generateData(4, 1));
            const updateResult = dataLayer.removeSeries(series1);
            (0, chai_1.expect)(updateResult.timeScale.points).not.to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).not.to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(barsCount - 1);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(2);
            const series1Update = updateResult.series.get(series1);
            (0, chai_1.expect)(series1Update).not.to.be.equal(undefined);
            (0, chai_1.expect)(series1Update === null || series1Update === void 0 ? void 0 : series1Update.data.length).to.be.equal(0);
            const series2Update = updateResult.series.get(series2);
            (0, chai_1.expect)(series2Update).not.to.be.equal(undefined);
            (0, chai_1.expect)(series2Update === null || series2Update === void 0 ? void 0 : series2Update.data.length).to.be.equal(barsCount);
        });
        (0, mocha_1.it)('remove second series', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series1 = createSeriesMock();
            const series2 = createSeriesMock();
            dataLayer.setSeriesData(series1, generateData(1, 3));
            dataLayer.setSeriesData(series2, generateData(4, 1));
            const updateResult = dataLayer.removeSeries(series2);
            (0, chai_1.expect)(updateResult.timeScale.points).not.to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).not.to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(barsCount - 1);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(2);
            const series1Update = updateResult.series.get(series1);
            (0, chai_1.expect)(series1Update).not.to.be.equal(undefined);
            (0, chai_1.expect)(series1Update === null || series1Update === void 0 ? void 0 : series1Update.data.length).to.be.equal(barsCount);
            const series2Update = updateResult.series.get(series2);
            (0, chai_1.expect)(series2Update).not.to.be.equal(undefined);
            (0, chai_1.expect)(series2Update === null || series2Update === void 0 ? void 0 : series2Update.data.length).to.be.equal(0);
        });
    });
    (0, mocha_1.describe)('customValues', () => {
        (0, mocha_1.it)('should be able to store customValues in a data point', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            // actually we don't need to use Series, so we just use new Object()
            const series1 = createSeriesMock();
            const updateResult = dataLayer.setSeriesData(series1, [
                dataItemAt(1000),
                Object.assign(Object.assign({}, dataItemAt(4000)), { customValues: {
                        testValue: 1234,
                        testString: 'abc',
                    } }),
            ]);
            updateResult.series.forEach((seriesUpdate, series) => {
                (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
                if (series === series1) {
                    (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(1);
                    (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(4000);
                    (0, chai_1.expect)(seriesUpdate.data[1].customValues).to.not.be.equal(undefined);
                    (0, chai_1.expect)(seriesUpdate.data[1].customValues).to.deep.equal({ testValue: 1234, testString: 'abc' });
                }
            });
        });
        (0, mocha_1.it)('should be able to remove customValues from last existing point', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            // actually we don't need to use Series, so we just use new Object()
            const series1 = createSeriesMock();
            dataLayer.setSeriesData(series1, [
                dataItemAt(1000),
                Object.assign(Object.assign({}, dataItemAt(4000)), { customValues: {
                        testValue: 1234,
                    } }),
            ]);
            // change the last point of the first series
            const updateResult = dataLayer.updateSeriesData(series1, dataItemAt(4000));
            updateResult.series.forEach((seriesUpdate, series) => {
                (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
                if (series === series1) {
                    (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(1);
                    (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(4000);
                    (0, chai_1.expect)(seriesUpdate.data[1].customValues).to.be.equal(undefined);
                }
            });
        });
        (0, mocha_1.it)('should be able to replace data including customValues with whitespace', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = createSeriesMock();
            dataLayer.setSeriesData(series, [
                dataItemAt(1000),
                dataItemAt(4000),
                Object.assign(Object.assign({}, dataItemAt(5000)), { customValues: {
                        testValue: 1234,
                    } }),
            ]);
            const updateResult = dataLayer.updateSeriesData(series, whitespaceItemAt(5000));
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(1);
            (0, chai_1.expect)(updateResult.timeScale.points).to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
            const seriesUpdate = updateResult.series.get(series);
            (0, chai_1.expect)(seriesUpdate).not.to.be.equal(undefined);
            (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
            (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(0);
            (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(1000);
            (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(1);
            (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(4000);
            // Update the last item from whitespace back to a normal data item (without customValue)
            const updateResultTwo = dataLayer.updateSeriesData(series, dataItemAt(5000));
            updateResultTwo.series.forEach((seriesUpdateTwo, updatedSeries) => {
                (0, chai_1.expect)(seriesUpdateTwo.data.length).to.be.equal(3);
                if (updatedSeries === series) {
                    (0, chai_1.expect)(seriesUpdateTwo.data[2].index).to.be.equal(2);
                    (0, chai_1.expect)(seriesUpdateTwo.data[2].time.timestamp).to.be.equal(5000);
                    (0, chai_1.expect)(seriesUpdateTwo.data[2].customValues).to.be.equal(undefined);
                }
            });
        });
    });
    (0, mocha_1.describe)('whitespaces', () => {
        (0, mocha_1.it)('should allow to set whitespaces to series', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = createSeriesMock();
            const updateResult = dataLayer.setSeriesData(series, [
                dataItemAt(1000),
                whitespaceItemAt(2000),
                whitespaceItemAt(3000),
                dataItemAt(4000),
            ]);
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(3);
            (0, chai_1.expect)(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
                { time: { timestamp: 1000 }, timeWeight: 21, originalTime: 1000 },
                { time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
                { time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
                { time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
            ]);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(0);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
            const seriesUpdate = updateResult.series.get(series);
            (0, chai_1.expect)(seriesUpdate).not.to.be.equal(undefined);
            (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
            (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(0);
            (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(1000);
            (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(3);
            (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(4000);
        });
        (0, mocha_1.it)('should allow to append whitespace via update', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = createSeriesMock();
            dataLayer.setSeriesData(series, [
                dataItemAt(1000),
                dataItemAt(4000),
            ]);
            const updateResult = dataLayer.updateSeriesData(series, whitespaceItemAt(5000));
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(1);
            (0, chai_1.expect)(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
                { time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
                { time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
                { time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
            ]);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(2);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
            const seriesUpdate = updateResult.series.get(series);
            (0, chai_1.expect)(seriesUpdate).not.to.be.equal(undefined);
            (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
            (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(0);
            (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(1000);
            (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(1);
            (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(4000);
        });
        (0, mocha_1.it)('should allow to replace whitespace with bar', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = createSeriesMock();
            dataLayer.setSeriesData(series, [
                dataItemAt(1000),
                dataItemAt(4000),
                whitespaceItemAt(5000),
            ]);
            const updateResult = dataLayer.updateSeriesData(series, dataItemAt(5000));
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(2);
            (0, chai_1.expect)(updateResult.timeScale.points).to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
            const seriesUpdate = updateResult.series.get(series);
            (0, chai_1.expect)(seriesUpdate).not.to.be.equal(undefined);
            (0, chai_1.expect)(seriesUpdate.data).excludingEvery(['value', 'originalTime']).to.have.deep.members([
                { index: 0, time: { timestamp: 1000 } },
                { index: 1, time: { timestamp: 4000 } },
                { index: 2, time: { timestamp: 5000 } },
            ]);
        });
        (0, mocha_1.it)('should allow to replace bar with whitespace', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series = createSeriesMock();
            dataLayer.setSeriesData(series, [
                dataItemAt(1000),
                dataItemAt(4000),
                dataItemAt(5000),
            ]);
            const updateResult = dataLayer.updateSeriesData(series, whitespaceItemAt(5000));
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(1);
            (0, chai_1.expect)(updateResult.timeScale.points).to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(undefined);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(1);
            const seriesUpdate = updateResult.series.get(series);
            (0, chai_1.expect)(seriesUpdate).not.to.be.equal(undefined);
            (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
            (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(0);
            (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(1000);
            (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(1);
            (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(4000);
        });
        (0, mocha_1.it)('should generate full update if whitespace extends timescale', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series1 = createSeriesMock();
            const series2 = createSeriesMock();
            dataLayer.setSeriesData(series1, [
                dataItemAt(1000),
                dataItemAt(5000),
            ]);
            dataLayer.setSeriesData(series2, [
                dataItemAt(2000),
                dataItemAt(3000),
            ]);
            const updateResult = dataLayer.updateSeriesData(series2, whitespaceItemAt(4000));
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(4);
            (0, chai_1.expect)(updateResult.timeScale.points).excludingEvery('pointData').to.have.deep.members([
                { time: { timestamp: 1000 }, timeWeight: 70, originalTime: 1000 },
                { time: { timestamp: 2000 }, timeWeight: 22, originalTime: 2000 },
                { time: { timestamp: 3000 }, timeWeight: 21, originalTime: 3000 },
                { time: { timestamp: 4000 }, timeWeight: 30, originalTime: 4000 },
                { time: { timestamp: 5000 }, timeWeight: 21, originalTime: 5000 },
            ]);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(3);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(2);
            updateResult.series.forEach((seriesUpdate, series) => {
                (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
                if (series === series1) {
                    (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(0);
                    (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(1000);
                    (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(4);
                    (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(5000);
                }
                else {
                    (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(1);
                    (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(2000);
                    (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(2);
                    (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(3000);
                }
            });
        });
        (0, mocha_1.it)('should remove old whitespaces while setting new data', () => {
            const dataLayer = new data_layer_1.DataLayer(behavior);
            const series1 = createSeriesMock();
            const series2 = createSeriesMock();
            dataLayer.setSeriesData(series1, [
                dataItemAt(1000),
                dataItemAt(5000),
            ]);
            dataLayer.setSeriesData(series2, [
                dataItemAt(2000),
                dataItemAt(3000),
                whitespaceItemAt(4000),
            ]);
            const updateResult = dataLayer.setSeriesData(series2, [
                dataItemAt(2000),
                dataItemAt(3000),
                whitespaceItemAt(6000),
            ]);
            (0, chai_1.expect)(updateResult.timeScale.baseIndex).to.be.equal(3);
            (0, chai_1.expect)(updateResult.timeScale.points).excludingEvery(['pointData', 'originalTime']).to.have.deep.members([
                { time: { timestamp: 1000 }, timeWeight: 70 },
                { time: { timestamp: 2000 }, timeWeight: 22 },
                { time: { timestamp: 3000 }, timeWeight: 21 },
                { time: { timestamp: 5000 }, timeWeight: 30 },
                { time: { timestamp: 6000 }, timeWeight: 22 },
            ]);
            (0, chai_1.expect)(updateResult.timeScale.firstChangedPointIndex).to.be.equal(3);
            (0, chai_1.expect)(updateResult.series.size).to.be.equal(2);
            updateResult.series.forEach((seriesUpdate, series) => {
                (0, chai_1.expect)(seriesUpdate.data.length).to.be.equal(2);
                if (series === series1) {
                    (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(0);
                    (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(1000);
                    (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(3);
                    (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(5000);
                }
                else {
                    (0, chai_1.expect)(seriesUpdate.data[0].index).to.be.equal(1);
                    (0, chai_1.expect)(seriesUpdate.data[0].time.timestamp).to.be.equal(2000);
                    (0, chai_1.expect)(seriesUpdate.data[1].index).to.be.equal(2);
                    (0, chai_1.expect)(seriesUpdate.data[1].time.timestamp).to.be.equal(3000);
                }
            });
        });
    });
});
