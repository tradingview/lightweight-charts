import { expect } from 'chai';
import { describe, it } from 'mocha';

import { precisionByMinMove } from '../../src/model/series-options';

describe('SeriesOptions', () => {
	it('precisionByMinMove', () => {
		expect(precisionByMinMove(0.001)).to.be.equal(3);
		expect(precisionByMinMove(0.01)).to.be.equal(2);
		expect(precisionByMinMove(0.1)).to.be.equal(1);
		expect(precisionByMinMove(1)).to.be.equal(0);
		expect(precisionByMinMove(10)).to.be.equal(0);
		expect(precisionByMinMove(0.25)).to.be.equal(2);
	});
});
