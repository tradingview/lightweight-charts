"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const time_scale_options_defaults_1 = require("../../src/api/options/time-scale-options-defaults");
const horz_scale_behavior_time_1 = require("../../src/model/horz-scale-behavior-time/horz-scale-behavior-time");
const time_scale_1 = require("../../src/model/time-scale");
function chartModelMock() {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return {
        recalculateAllPanes: () => { },
        lightUpdate: () => { },
    };
}
function tsUpdate(to) {
    const points = [];
    const startIndex = 0;
    for (let i = startIndex; i <= to; ++i) {
        points.push({ time: { timestamp: i }, timeWeight: 20, originalTime: i });
    }
    return [points, 0];
}
const behavior = new horz_scale_behavior_time_1.HorzScaleBehaviorTime();
(0, mocha_1.describe)('TimeScale', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeLocalizationOptions = {};
    (0, mocha_1.it)('indexToCoordinate and coordinateToIndex inverse', () => {
        const lastIndex = 499;
        const ts = new time_scale_1.TimeScale(chartModelMock(), Object.assign(Object.assign({}, time_scale_options_defaults_1.timeScaleOptionsDefaults), { barSpacing: 1, rightOffset: 0 }), fakeLocalizationOptions, behavior);
        ts.setWidth(500);
        ts.update(...tsUpdate(lastIndex));
        ts.setBaseIndex(lastIndex);
        (0, chai_1.expect)(ts.indexToCoordinate(ts.coordinateToIndex(499.5))).to.be.equal(499.5);
    });
    (0, mocha_1.it)('all *ToCoordinate functions should return same coordinate for the same index', () => {
        const lastIndex = 499;
        const ts = new time_scale_1.TimeScale(chartModelMock(), Object.assign(Object.assign({}, time_scale_options_defaults_1.timeScaleOptionsDefaults), { barSpacing: 1, rightOffset: 0 }), fakeLocalizationOptions, behavior);
        ts.setWidth(500);
        ts.update(...tsUpdate(lastIndex));
        ts.setBaseIndex(lastIndex);
        const index = 1;
        const expectedValue = 0.5;
        (0, chai_1.expect)(ts.indexToCoordinate(index)).to.be.equal(expectedValue, 'indexToCoordinate');
        {
            const indexes = [{ time: index, x: 0 }];
            ts.indexesToCoordinates(indexes);
            (0, chai_1.expect)(indexes[0].x).to.be.equal(expectedValue, 'indexesToCoordinates');
        }
    });
    (0, mocha_1.describe)('timeToIndex', () => {
        (0, mocha_1.it)('should return index for time on scale', () => {
            const ts = new time_scale_1.TimeScale(chartModelMock(), time_scale_options_defaults_1.timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);
            ts.update(...tsUpdate(2));
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 0 }, false)).to.be.equal(0);
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 1 }, false)).to.be.equal(1);
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 2 }, false)).to.be.equal(2);
        });
        (0, mocha_1.it)('should return null for time not on scale', () => {
            const ts = new time_scale_1.TimeScale(chartModelMock(), time_scale_options_defaults_1.timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);
            ts.update(...tsUpdate(2));
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: -1 }, false)).to.be.equal(null);
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 3 }, false)).to.be.equal(null);
        });
        (0, mocha_1.it)('should return null if time scale is empty', () => {
            const ts = new time_scale_1.TimeScale(chartModelMock(), time_scale_options_defaults_1.timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 123 }, false)).to.be.equal(null);
        });
        (0, mocha_1.it)('should return null if timestamp is between two values on the scale', () => {
            const ts = new time_scale_1.TimeScale(chartModelMock(), time_scale_options_defaults_1.timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);
            ts.update(...tsUpdate(1));
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 0.5 }, false)).to.be.equal(null);
        });
        (0, mocha_1.it)('should return last index if timestamp is greater than last timestamp and findNearest is parameter is true', () => {
            const ts = new time_scale_1.TimeScale(chartModelMock(), time_scale_options_defaults_1.timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);
            ts.update(...tsUpdate(2));
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 3 }, true)).to.be.equal(2);
        });
        (0, mocha_1.it)('should return first index if timestamp is less than first timestamp and findNearest is parameter is true', () => {
            const ts = new time_scale_1.TimeScale(chartModelMock(), time_scale_options_defaults_1.timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);
            ts.update(...tsUpdate(2));
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: -1 }, true)).to.be.equal(0);
        });
        (0, mocha_1.it)('should return next index if timestamp is between two values on the scale and findNearest parameter is true', () => {
            const ts = new time_scale_1.TimeScale(chartModelMock(), time_scale_options_defaults_1.timeScaleOptionsDefaults, fakeLocalizationOptions, behavior);
            ts.update(...tsUpdate(1));
            (0, chai_1.expect)(ts.timeToIndex({ timestamp: 0.5 }, true)).to.be.equal(1);
        });
    });
});
