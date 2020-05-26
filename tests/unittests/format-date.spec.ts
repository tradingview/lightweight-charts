import { expect } from 'chai';
import { describe, it } from 'mocha';

import { formatDate } from '../../src/formatters/format-date';

describe('formatDate', () => {
	const date = new Date('1990-04-24');
	const locale = 'en-US';

	it('should correct handle yyyy sequence', () => {
		expect(formatDate(date, 'yyyy', locale)).to.be.equal('1990');
		expect(formatDate(date, 'yyyy yyyy', locale)).to.be.equal('1990 1990');
	});

	it('should correct handle yy sequence', () => {
		expect(formatDate(date, 'yy', locale)).to.be.equal('90');
		expect(formatDate(date, 'yy yy', locale)).to.be.equal('90 90');
	});

	it('should correct handle yyyy and yy sequences', () => {
		expect(formatDate(date, 'yyyy yy', locale)).to.be.equal('1990 90');
		expect(formatDate(date, 'yy yyyy', locale)).to.be.equal('90 1990');

		expect(formatDate(date, 'yy yyyy yy yyyy yyyy yy', locale)).to.be.equal('90 1990 90 1990 1990 90');
	});

	it('should correct handle MMMM sequence', () => {
		expect(formatDate(date, 'MMMM', locale)).to.be.equal('April');
		expect(formatDate(date, 'MMMM MMMM', locale)).to.be.equal('April April');
	});

	it('should correct handle MMM sequence', () => {
		expect(formatDate(date, 'MMM', locale)).to.be.equal('Apr');
		expect(formatDate(date, 'MMM MMM', locale)).to.be.equal('Apr Apr');
	});

	it('should correct handle MM sequence', () => {
		expect(formatDate(date, 'MM', locale)).to.be.equal('04');
		expect(formatDate(date, 'MM MM', locale)).to.be.equal('04 04');
	});

	it('should correct handle MMMM, MMM and MM sequences', () => {
		expect(formatDate(date, 'MMMM MMM MM', locale)).to.be.equal('April Apr 04');
		expect(formatDate(date, 'MMMM MMM MM MM MMM MMMM', locale)).to.be.equal('April Apr 04 04 Apr April');
	});

	it('should correct handle dd sequence', () => {
		expect(formatDate(date, 'dd', locale)).to.be.equal('24');
		expect(formatDate(date, 'dd dd', locale)).to.be.equal('24 24');
	});

	it('should ignore non-sequences', () => {
		expect(
			formatDate(date, 'My custom format for date is yyyy-yy-MMMM-MM-MMM dd!', locale)
		).to.be.equal('My custom format for date is 1990-90-April-04-Apr 24!');
	});
});
