import { expect } from 'chai';
import { describe, it } from 'mocha';

import { generateContrastColors } from '../../src/helpers/color';

describe('generateContrastColors', () => {
	it('should work', () => {
		expect(generateContrastColors('rgb(255, 255, 255)')).to.be.deep.equal({ text: 'black', background: 'rgb(255, 255, 255)' });
		expect(generateContrastColors('rgb(255, 255, 255)')).to.be.deep.equal({ text: 'black', background: 'rgb(255, 255, 255)' });
		expect(generateContrastColors('rgba(255, 255, 255, 0)')).to.be.deep.equal({ text: 'black', background: 'rgb(255, 255, 255)' });
		expect(generateContrastColors('rgba(255, 255, 255, 1)')).to.be.deep.equal({ text: 'black', background: 'rgb(255, 255, 255)' });

		expect(generateContrastColors('rgb(0, 0, 0)')).to.be.deep.equal({ text: 'white', background: 'rgb(0, 0, 0)' });
		expect(generateContrastColors('rgb(0, 0, 0)')).to.be.deep.equal({ text: 'white', background: 'rgb(0, 0, 0)' });
		expect(generateContrastColors('rgba(0, 0, 0, 0)')).to.be.deep.equal({ text: 'white', background: 'rgb(0, 0, 0)' });
		expect(generateContrastColors('rgba(0, 0, 0, 1)')).to.be.deep.equal({ text: 'white', background: 'rgb(0, 0, 0)' });

		// TODO: add more tests
	});
});
