/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { after, before, describe, it } from 'node:test';

import { defaultTickMarkFormatter } from '../../src/model/horz-scale-behavior-time/default-tick-mark-formatter';
import { TickMarkType, TimePoint, UTCTimestamp } from '../../src/model/horz-scale-behavior-time/types';

function time(dateTimeStr: string): TimePoint {
	return {
		timestamp: new Date(dateTimeStr).getTime() / 1000 as UTCTimestamp,
	};
}

describe('defaultTickMarkFormatter', () => {
	it('correct format year', () => {
		expect(defaultTickMarkFormatter(time('2019-01-01'), TickMarkType.Year, 'en')).to.be.equal('2019');
		expect(defaultTickMarkFormatter(time('2020-01-01'), TickMarkType.Year, 'en')).to.be.equal('2020');
	});

	it('correct format month', () => {
		expect(defaultTickMarkFormatter(time('2019-01-01'), TickMarkType.Month, 'en')).to.be.equal('Jan');
		expect(defaultTickMarkFormatter(time('2019-12-01'), TickMarkType.Month, 'en')).to.be.equal('Dec');

		// doesn't work in CI :(
		// expect(defaultTickMarkFormatter(time('2019-01-01'), TickMarkType.Month, 'ru')).to.be.equal('янв.');
	});

	it('correct format day of month', () => {
		expect(defaultTickMarkFormatter(time('2019-01-01'), TickMarkType.DayOfMonth, 'en')).to.be.equal('1');
		expect(defaultTickMarkFormatter(time('2019-01-31'), TickMarkType.DayOfMonth, 'en')).to.be.equal('31');
	});

	it('correct format time without seconds', () => {
		expect(defaultTickMarkFormatter(time('2019-01-01T01:10:00.000Z'), TickMarkType.Time, 'en')).to.be.equal('01:10');
		expect(defaultTickMarkFormatter(time('2019-01-01T17:59:00.000Z'), TickMarkType.Time, 'en')).to.be.equal('17:59');
		expect(defaultTickMarkFormatter(time('2019-01-01T18:59:59.000Z'), TickMarkType.Time, 'en')).to.be.equal('18:59');
	});

	it('correct format time with seconds', () => {
		expect(defaultTickMarkFormatter(time('2019-01-01T01:10:10.000Z'), TickMarkType.TimeWithSeconds, 'en')).to.be.equal('01:10:10');
		expect(defaultTickMarkFormatter(time('2019-01-01T17:59:44.000Z'), TickMarkType.TimeWithSeconds, 'en')).to.be.equal('17:59:44');
	});

	describe('when the local time zone skips an hour for daylight saving time', () => {
		let previousTimeZone: string | undefined;

		before(() => {
			previousTimeZone = process.env.TZ;
			process.env.TZ = 'America/New_York';
		});

		after(() => {
			if (previousTimeZone === undefined) {
				delete process.env.TZ;
			} else {
				process.env.TZ = previousTimeZone;
			}
		});

		it('correct format time that falls into the skipped local hour', () => {
			// 2026-03-08 02:00-02:59 does not exist in America/New_York
			expect(new Date(2026, 2, 8, 2, 30).getHours()).to.be.equal(3);

			expect(defaultTickMarkFormatter(time('2026-03-08T01:30:00.000Z'), TickMarkType.Time, 'en')).to.be.equal('01:30');
			expect(defaultTickMarkFormatter(time('2026-03-08T02:00:00.000Z'), TickMarkType.Time, 'en')).to.be.equal('02:00');
			expect(defaultTickMarkFormatter(time('2026-03-08T02:30:00.000Z'), TickMarkType.Time, 'en')).to.be.equal('02:30');
			expect(defaultTickMarkFormatter(time('2026-03-08T02:30:15.000Z'), TickMarkType.TimeWithSeconds, 'en')).to.be.equal('02:30:15');
			expect(defaultTickMarkFormatter(time('2026-03-08T03:00:00.000Z'), TickMarkType.Time, 'en')).to.be.equal('03:00');
		});
	});
});
