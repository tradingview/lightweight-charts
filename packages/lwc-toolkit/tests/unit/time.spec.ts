import { expect } from 'chai';
import { BusinessDay, UTCTimestamp } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { convertTime, displayTime, formattedDateAndTime } from '../../src/time.js';

void describe('convertTime', () => {
	void it('multiplies a UTCTimestamp by 1000', () => {
		expect(convertTime(1745480000 as UTCTimestamp)).to.equal(1745480000000);
		expect(convertTime(0 as UTCTimestamp)).to.equal(0);
		expect(convertTime(-1 as UTCTimestamp)).to.equal(-1000);
	});

	void it('builds a BusinessDay as LOCAL midnight, not UTC midnight', () => {
		const converted = convertTime({
			year: 2021,
			month: 5,
			day: 12,
		} as BusinessDay);
		// `BusinessDay.month` is 1-based, the Date constructor's is 0-based
		expect(converted).to.equal(new Date(2021, 4, 12).valueOf());
		const asDate = new Date(converted);
		expect(asDate.getFullYear()).to.equal(2021);
		expect(asDate.getMonth()).to.equal(4);
		expect(asDate.getDate()).to.equal(12);
		expect(asDate.getHours()).to.equal(0);
		expect(asDate.getMinutes()).to.equal(0);
	});

	void it('builds a date string the same way as the equivalent BusinessDay', () => {
		expect(convertTime('2021-05-12')).to.equal(
			convertTime({ year: 2021, month: 5, day: 12 } as BusinessDay)
		);
		expect(convertTime('2021-05-12')).to.equal(new Date(2021, 4, 12).valueOf());
	});

	void it('a calendar day only equals UTC midnight when the local offset is zero', () => {
		const converted = convertTime('2021-05-12');
		const utcMidnight = Date.UTC(2021, 4, 12);
		const offsetMinutes = new Date(2021, 4, 12).getTimezoneOffset();
		expect(converted).to.equal(utcMidnight + offsetMinutes * 60_000);
		if (offsetMinutes === 0) {
			expect(converted).to.equal(utcMidnight);
		} else {
			expect(converted).to.not.equal(utcMidnight);
		}
	});

	void it('accepts a zero-padded or unpadded date string', () => {
		expect(convertTime('2021-5-2')).to.equal(convertTime('2021-05-02'));
	});

	void it('ignores anything after the day in a date string', () => {
		expect(convertTime('2021-05-12T12:34:56Z')).to.equal(
			convertTime('2021-05-12')
		);
	});
});

void describe('displayTime', () => {
	void it('returns a string time verbatim', () => {
		expect(displayTime('2021-05-12')).to.equal('2021-05-12');
	});

	void it('formats a BusinessDay using the local calendar day', () => {
		expect(
			displayTime({ year: 2021, month: 5, day: 12 } as BusinessDay)
		).to.equal(new Date(2021, 4, 12).toLocaleDateString());
	});

	void it('formats a UTCTimestamp as seconds since the epoch', () => {
		expect(displayTime(1745480000 as UTCTimestamp)).to.equal(
			new Date(1745480000000).toLocaleDateString()
		);
	});
});

void describe('formattedDateAndTime', () => {
	void it('returns two empty strings for undefined', () => {
		expect(formattedDateAndTime(undefined)).to.deep.equal(['', '']);
	});

	void it('returns two empty strings for a timestamp of 0, because it is falsy', () => {
		// Questionable, but current behaviour: the epoch itself is treated as
		// "no timestamp".
		expect(formattedDateAndTime(0)).to.deep.equal(['', '']);
	});

	void it('zero-pads the day, hour and minute', () => {
		const timestamp = new Date(2021, 4, 2, 9, 5).valueOf();
		const [date, time] = formattedDateAndTime(timestamp);
		expect(time).to.equal('09:05');
		expect(date.startsWith('02 ')).to.equal(true);
		expect(date.endsWith(' 2021')).to.equal(true);
	});

	void it('reads local date getters, so it round-trips convertTime for a calendar day', () => {
		const [date] = formattedDateAndTime(convertTime('2021-05-12'));
		expect(date.startsWith('12 ')).to.equal(true);
		expect(date.endsWith(' 2021')).to.equal(true);
	});

	void it('formats the date as "DD Mon YYYY" and the time as "HH:MM"', () => {
		const source = new Date(2021, 11, 25, 23, 59);
		const [date, time] = formattedDateAndTime(source.valueOf());
		expect(time).to.equal('23:59');
		expect(date).to.equal(
			`25 ${source.toLocaleString('default', { month: 'short' })} 2021`
		);
	});
});
