"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const mocha_1 = require("mocha");
const default_tick_mark_formatter_1 = require("../../src/model/horz-scale-behavior-time/default-tick-mark-formatter");
function time(dateTimeStr) {
    return {
        timestamp: new Date(dateTimeStr).getTime() / 1000,
    };
}
(0, mocha_1.describe)('defaultTickMarkFormatter', () => {
    (0, mocha_1.it)('correct format year', () => {
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01'), 0 /* TickMarkType.Year */, 'en')).to.be.equal('2019');
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2020-01-01'), 0 /* TickMarkType.Year */, 'en')).to.be.equal('2020');
    });
    (0, mocha_1.it)('correct format month', () => {
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01'), 1 /* TickMarkType.Month */, 'en')).to.be.equal('Jan');
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-12-01'), 1 /* TickMarkType.Month */, 'en')).to.be.equal('Dec');
        // doesn't work in CI :(
        // expect(defaultTickMarkFormatter(time('2019-01-01'), TickMarkType.Month, 'ru')).to.be.equal('янв.');
    });
    (0, mocha_1.it)('correct format day of month', () => {
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01'), 2 /* TickMarkType.DayOfMonth */, 'en')).to.be.equal('1');
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-31'), 2 /* TickMarkType.DayOfMonth */, 'en')).to.be.equal('31');
    });
    (0, mocha_1.it)('correct format time without seconds', () => {
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01T01:10:00.000Z'), 3 /* TickMarkType.Time */, 'en')).to.be.equal('01:10');
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01T17:59:00.000Z'), 3 /* TickMarkType.Time */, 'en')).to.be.equal('17:59');
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01T18:59:59.000Z'), 3 /* TickMarkType.Time */, 'en')).to.be.equal('18:59');
    });
    (0, mocha_1.it)('correct format time with seconds', () => {
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01T01:10:10.000Z'), 4 /* TickMarkType.TimeWithSeconds */, 'en')).to.be.equal('01:10:10');
        (0, chai_1.expect)((0, default_tick_mark_formatter_1.defaultTickMarkFormatter)(time('2019-01-01T17:59:44.000Z'), 4 /* TickMarkType.TimeWithSeconds */, 'en')).to.be.equal('17:59:44');
    });
});
