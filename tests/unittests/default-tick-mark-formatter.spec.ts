import { expect } from 'chai';
import { describe, it } from 'mocha';

import { defaultTickMarkFormatter } from '../../src/model/default-tick-mark-formatter';
import { TimePoint, UTCTimestamp } from '../../src/model/time-data';
import { TickMarkType } from '../../src/model/time-scale';

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
});
