import { expect } from 'chai';
import { describe, it } from 'mocha';

import { DateFormatter } from '../../src/formatters/date-formatter';
import { DateTimeFormatter } from '../../src/formatters/date-time-formatter';
import { PercentageFormatter } from '../../src/formatters/percentage-formatter';
import { PriceFormatter } from '../../src/formatters/price-formatter';
import { TimeFormatter } from '../../src/formatters/time-formatter';
import { VolumeFormatter } from '../../src/formatters/volume-formatter';

describe('Formatters', () => {
	it('date-formatter', () => {
		{
			const formatter = new DateFormatter();
			const d = new Date(1516147200000);
			const res = formatter.format(d);
			expect(res).to.be.equal('2018-01-17');
		}
		{
			const formatter = new DateFormatter('dd-MM-yyyy');
			const d = new Date(1516147200000);
			const res = formatter.format(d);
			expect(res).to.be.equal('17-01-2018');
		}
	});
	it('date-time-formatter', () => {
		{
			const formatter = new DateTimeFormatter();
			const d = new Date(1538381512000);
			const res = formatter.format(d);
			expect(res).to.be.equal('2018-10-01 08:11:52');
		}
	});
	it('percent-formatter', () => {
		{
			const formatter = new PercentageFormatter();
			const res = formatter.format(1.5);
			expect(res).to.be.equal('1.50%');
		}
	});
	it('price-formatter', () => {
		{
			const formatter = new PriceFormatter();
			const res = formatter.format(1.5);
			expect(res).to.be.equal('1.50');
		}
		{
			const formatter = new PriceFormatter(1000);
			const res = formatter.format(1.5);
			expect(res).to.be.equal('1.500');
		}
		{
			const formatter = new PriceFormatter(1000, 250);
			const res = formatter.format(1.6);
			expect(res).to.be.equal('1.500');
		}
		{
			const formatter = new PriceFormatter();
			const res = formatter.format(-1.5);
			expect(res).to.be.equal('\u22121.50');
		}
	});
	it('time-formatter', () => {
		{
			const formatter = new TimeFormatter();
			const d = new Date(1538381512000);
			const res = formatter.format(d);
			expect(res).to.be.equal('08:11:52');
		}
		{
			const formatter = new TimeFormatter('%h-%m-%s');
			const d = new Date(1538381512000);
			const res = formatter.format(d);
			expect(res).to.be.equal('08-11-52');
		}
	});
	it('volume-formatter', () => {
		{
			const formatter = new VolumeFormatter(3);
			expect(formatter.format(1)).to.be.equal('1');
			expect(formatter.format(10)).to.be.equal('10');
			expect(formatter.format(100)).to.be.equal('100');
			expect(formatter.format(1000)).to.be.equal('1K');
			expect(formatter.format(5500)).to.be.equal('5.5K');
			expect(formatter.format(1155000)).to.be.equal('1.155M');
		}
	});
});
