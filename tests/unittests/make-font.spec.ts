import { expect } from 'chai';
import { describe, it } from 'mocha';

import { defaultFontFamily, makeFont } from '../../src/helpers/make-font';

describe('makeFont', () => {
	it('should correct generate font family without style', () => {
		expect(makeFont(12, 'Roboto')).to.be.equal('12px Roboto');
		expect(makeFont(120, 'Roboto')).to.be.equal('120px Roboto');
	});

	it('should correct generate font family with style', () => {
		expect(makeFont(12, 'Roboto', 'italic')).to.be.equal('italic 12px Roboto');
		expect(makeFont(120, 'Roboto', 'bold')).to.be.equal('bold 120px Roboto');
	});

	it('should correct generate font with default family', () => {
		expect(makeFont(12)).to.be.equal(`12px ${defaultFontFamily}`);
	});
});
