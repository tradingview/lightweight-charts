import { expect } from 'chai';
import { describe, it } from 'mocha';

import {
	colorWithTransparency,
	parseRgb,
	resetTransparency,
	Rgb,
	rgbToBlackWhiteString,
} from '../../src/helpers/color';

describe('rgbToBlackWhiteString', () => {
	it('should return \'black\' for black color and every non-zero threshold', () => {
		expect(rgbToBlackWhiteString([0, 0, 0] as Rgb, 0)).to.equal('white');
		expect(rgbToBlackWhiteString([0, 0, 0] as Rgb, 1)).to.equal('black');
		expect(rgbToBlackWhiteString([0, 0, 0] as Rgb, 255)).to.equal('black');
	});

	it('should return \'white\' for white color and any threshold', () => {
		expect(rgbToBlackWhiteString([255, 255, 255] as Rgb, 0)).to.equal('white');
		expect(rgbToBlackWhiteString([255, 255, 255] as Rgb, 1)).to.equal('white');
		expect(rgbToBlackWhiteString([255, 255, 255] as Rgb, 255)).to.equal('white');
	});

	it('should respect the threshold value', () => {
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0x00)).to.equal('white');
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0x11)).to.equal('white');
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0x33)).to.equal('white');
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0x55)).to.equal('white');
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0x77)).to.equal('white');
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0x99)).to.equal('white');
		// ------------------------------------------------------------------- //
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0xBB)).to.equal('black');
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0xDD)).to.equal('black');
		expect(rgbToBlackWhiteString([0xAA, 0xAA, 0xAA] as Rgb, 0xFF)).to.equal('black');
	});
});

// parsers
describe('parseRgb', () => {
	it('should correctly parse known named colors', () => {
		expect(parseRgb('aliceblue')).to.deep.equal([240, 248, 255]);
		expect(parseRgb('coral')).to.deep.equal([255, 127, 80]);
		expect(parseRgb('darkmagenta')).to.deep.equal([139, 0, 139]);
		expect(parseRgb('linen')).to.deep.equal([250, 240, 230]);
		expect(parseRgb('whitesmoke')).to.deep.equal([245, 245, 245]);
	});

	it('should correctly parse RGB tuple string', () => {
		expect(parseRgb('rgb(10, 20, 30)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgb(0,0,0)')).to.deep.equal([0, 0, 0]);
		expect(parseRgb('rgb(	10	 , 	20 	, 	30  	)')).to.deep.equal([10, 20, 30]);

		// RGB tuple may contain values exceeding 255, that should be clamped to 255 after parsing
		expect(parseRgb('rgb(256, 256, 256)')).to.deep.equal([255, 255, 255]);
		expect(parseRgb('rgb(100500, 100500, 100500)')).to.deep.equal([255, 255, 255]);
		expect(parseRgb('rgb(0, 100500, 0)')).to.deep.equal([0, 255, 0]);

		// RGB tuple may contain negative values, that should be clamped to zero after parsing
		expect(parseRgb('rgb(-10, -20, -30)')).to.deep.equal([0, 0, 0]);
		expect(parseRgb('rgb(10, -20, 30)')).to.deep.equal([10, 0, 30]);

		// whitespace characters before 'rgb', after 'rgb' and after the closing parenthesis are prohibited
		expect(parseRgb.bind(null, '   	rgb(	10, 	20, 	30 		 )')).to.throw();
		expect(parseRgb.bind(null, 'rgb	  (	10, 	20, 	30 		 )')).to.throw();
		expect(parseRgb.bind(null, 'rgb(	10, 	20, 	30 		 ) 	  ')).to.throw();

		// RGB tuple should not contain non-integer values
		expect(parseRgb.bind(null, 'rgb(10.0, 20, 30)')).to.throw();
		expect(parseRgb.bind(null, 'rgb(10, 20.0, 30)')).to.throw();
		expect(parseRgb.bind(null, 'rgb(10, 20, 30.0)')).to.throw();

		// not enough values in the tuple
		expect(parseRgb.bind(null, 'rgb(10, 20)')).to.throw();

		// too much values in the tuple
		expect(parseRgb.bind(null, 'rgb(10, 20, 30, 40)')).to.throw();
	});
});

describe('parseRgb with rgba', () => {
	it('should correctly parse RGBA tuple string', () => {
		expect(parseRgb('rgba(10, 20, 30, 0.40)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(0,0,0,1)')).to.deep.equal([0, 0, 0]);
		expect(parseRgb('rgba(	10 	, 	20 	, 	30	, 	0.40   	)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, 0.1)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, .1)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, .001)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, .000000000001)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, .10001)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, .10005)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, .100000000005)')).to.deep.equal([10, 20, 30]);

		// RGB components of a tuple may contain values exceeding 255, that should be clamped to 255 after parsing
		expect(parseRgb('rgba(256, 256, 256, 1.0)')).to.deep.equal([255, 255, 255]);
		expect(parseRgb('rgba(100500, 100500, 100500, 1.0)')).to.deep.equal([255, 255, 255]);
		expect(parseRgb('rgba(0, 100500, 0, 1.0)')).to.deep.equal([0, 255, 0]);

		// RGB components of a tuple may contain negative values, that should be clamped to zero after parsing
		expect(parseRgb('rgba(-10, -20, -30, 1.0)')).to.deep.equal([0, 0, 0]);
		expect(parseRgb('rgba(10, -20, 30, 1.0)')).to.deep.equal([10, 0, 30]);

		// Alpha component of a tuple may be a value exceeding 1.0, that should be clamped to 1.0 after parsing
		expect(parseRgb('rgba(10, 20, 30, 1.1)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, 1000.0)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, 1000000)')).to.deep.equal([10, 20, 30]);

		// Alpha component of a tuple may be a negative value, that should be clamped to zero after parsing
		expect(parseRgb('rgba(10, 20, 30, -0.1)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, -1.1)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, -1000.0)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, -1000000)')).to.deep.equal([10, 20, 30]);
		expect(parseRgb('rgba(10, 20, 30, -1000000.100000000005)')).to.deep.equal([10, 20, 30]);

		// dangling dot is prohibited
		expect(parseRgb.bind(null, 'rgba(10, 20, 30, 1.)')).to.throw();

		// whitespace characters before 'rgba', after 'rgba' and after the closing parenthesis are prohibited
		expect(parseRgb.bind(null, '   	rgba(	10, 	20, 	30	, 	0.40   	)')).to.throw();
		expect(parseRgb.bind(null, 'rgba	  (	10, 	20, 	30	, 	0.40   	)')).to.throw();
		expect(parseRgb.bind(null, 'rgba(	10, 	20, 	30	, 	0.40   	) 	  ')).to.throw();

		// RGB components of tuple should not contain non-integer values
		expect(parseRgb.bind(null, 'rgba(10.0, 20, 30, 0)')).to.throw();
		expect(parseRgb.bind(null, 'rgba(10, 20.0, 30, 0)')).to.throw();
		expect(parseRgb.bind(null, 'rgba(10, 20, 30.0, 0)')).to.throw();

		// not enough values in the tuple
		expect(parseRgb.bind(null, 'rgba(10, 20, 30)')).to.throw();

		// too much values in the tuple
		expect(parseRgb.bind(null, 'rgba(10, 20, 30, 1.0, 1.0)')).to.throw();
	});
});

describe('resetTransparency', () => {
	it('should work', () => {
		expect(resetTransparency('red')).to.equal('rgba(255, 0, 0, 1)');
		expect(resetTransparency('rgba(255, 0, 0, .1)')).to.equal('rgba(255, 0, 0, 1)');
	});

	it('should keep hex colors as is', () => {
		expect(resetTransparency('#0f0')).to.equal('#0f0');
		expect(resetTransparency('#0000ff')).to.equal('#0000ff');
	});
});

describe('colorWithTransparency', () => {
	it('should work', () => {
		expect(colorWithTransparency('red', 1)).to.equal('rgba(255, 0, 0, 1)');
		expect(colorWithTransparency('red', 0.5)).to.equal('rgba(255, 0, 0, 0.5)');
		expect(colorWithTransparency('red', 0)).to.equal('rgba(255, 0, 0, 0)');

		expect(colorWithTransparency('#0f0', 0.2)).to.equal('rgba(0, 255, 0, 0.2)');
		expect(colorWithTransparency('#00ff00', 0.7)).to.equal('rgba(0, 255, 0, 0.7)');

		// That how we roll!
		expect(colorWithTransparency('rgba(0, 0, 255, .1)', 0.6)).to.equal('rgba(0, 0, 255, 0.6)');
		expect(colorWithTransparency('rgba(-1, -2, 123, 9001)', 0.65)).to.equal('rgba(0, 0, 123, 0.65)');
	});

	it('should normalize alpha channel', () => {
		expect(colorWithTransparency('red', -1)).to.equal('rgba(255, 0, 0, 0)');
		expect(colorWithTransparency('red', 2)).to.equal('rgba(255, 0, 0, 1)');
		expect(colorWithTransparency('red', -0)).to.equal('rgba(255, 0, 0, 0)');
		expect(colorWithTransparency('red', NaN)).to.equal('rgba(255, 0, 0, 0)');
		expect(colorWithTransparency('red', 0.30004)).to.equal('rgba(255, 0, 0, 0.3)');
		expect(colorWithTransparency('red', 0.30006)).to.equal('rgba(255, 0, 0, 0.3001)');
	});
});
