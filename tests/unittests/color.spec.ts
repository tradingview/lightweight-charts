/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { ColorParser, Rgba } from '../../src/model/colors';

type SimpleRgba = number[] & { length: 4 };

function generateRgba(rgba: SimpleRgba): Rgba {
	return rgba as Rgba;
}

/**
 * The initialCache is used so that we can skip the requirement
 * to try create a document element and use the browser for
 * color parsing. The assumption is that the browser will do
 * this correctly anyway.
 */
const initialCache: Map<string, Rgba> = new Map([
	['rgb(255, 255, 255)', generateRgba([255, 255, 255, 1])],
	['rgba(255, 255, 255, 0)', generateRgba([255, 255, 255, 0])],
	['rgba(255, 255, 255, 1)', generateRgba([255, 255, 255, 1])],
	['rgb(0, 0, 0)', generateRgba([0, 0, 0, 1])],
	['rgba(0, 0, 0, 0)', generateRgba([0, 0, 0, 0])],
	['rgba(0, 0, 0, 1)', generateRgba([0, 0, 0, 1])],

	['rgb(150, 150, 150)', generateRgba([150, 150, 150, 1])],
	['rgb(170, 170, 170)', generateRgba([170, 170, 170, 1])],
	['rgba(150, 150, 150, 0)', generateRgba([150, 150, 150, 0])],
	['rgba(170, 170, 170, 0)', generateRgba([170, 170, 170, 0])],
	['rgb(130, 140, 160)', generateRgba([130, 140, 160, 1])],
	['rgb(190, 180, 160)', generateRgba([190, 180, 160, 1])],

	['rgb(150, 150, 150)', generateRgba([150, 150, 150, 1])],
	['rgb(170, 170, 170)', generateRgba([170, 170, 170, 1])],

	['#ffffff', generateRgba([255, 255, 255, 1])],
	['#000000', generateRgba([0, 0, 0, 1])],
	['#fff', generateRgba([255, 255, 255, 1])],
	['#000', generateRgba([0, 0, 0, 1])],
]);
const colorParser = new ColorParser([], initialCache);

describe('generateContrastColors', () => {
	it('should work', () => {
		expect(colorParser.generateContrastColors('rgb(255, 255, 255)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
		expect(colorParser.generateContrastColors('rgb(255, 255, 255)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
		expect(colorParser.generateContrastColors('rgba(255, 255, 255, 0)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });
		expect(colorParser.generateContrastColors('rgba(255, 255, 255, 1)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(255, 255, 255)' });

		expect(colorParser.generateContrastColors('rgb(0, 0, 0)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
		expect(colorParser.generateContrastColors('rgb(0, 0, 0)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
		expect(colorParser.generateContrastColors('rgba(0, 0, 0, 0)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
		expect(colorParser.generateContrastColors('rgba(0, 0, 0, 1)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(0, 0, 0)' });
	});

	it('correct contrast color', () => {
		expect(colorParser.generateContrastColors('rgb(150, 150, 150)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(150, 150, 150)' });
		expect(colorParser.generateContrastColors('rgb(170, 170, 170)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(170, 170, 170)' });
		expect(colorParser.generateContrastColors('rgba(150, 150, 150, 0)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(150, 150, 150)' });
		expect(colorParser.generateContrastColors('rgba(170, 170, 170, 0)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(170, 170, 170)' });
		expect(colorParser.generateContrastColors('rgb(130, 140, 160)')).to.be.deep.equal({ foreground: 'white', background: 'rgb(130, 140, 160)' });
		expect(colorParser.generateContrastColors('rgb(190, 180, 160)')).to.be.deep.equal({ foreground: 'black', background: 'rgb(190, 180, 160)' });
	});
});

describe('gradientColorAtPercent', () => {
	it('0%', () => {
		expect(colorParser.gradientColorAtPercent('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 0)).to.be.equal('rgba(255, 255, 255, 1)');
		expect(colorParser.gradientColorAtPercent('rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 0)', 0)).to.be.equal('rgba(255, 255, 255, 1)');
		expect(colorParser.gradientColorAtPercent('#ffffff', '#000000', 0)).to.be.equal('rgba(255, 255, 255, 1)');
		expect(colorParser.gradientColorAtPercent('#fff', '#000', 0)).to.be.equal('rgba(255, 255, 255, 1)');
	});

	it('50%', () => {
		expect(colorParser.gradientColorAtPercent('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 0.5)).to.be.equal('rgba(128, 128, 128, 1)');
		expect(colorParser.gradientColorAtPercent('rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 0)', 0.5)).to.be.equal('rgba(128, 128, 128, 0.5)');
		expect(colorParser.gradientColorAtPercent('#ffffff', '#000000', 0.5)).to.be.equal('rgba(128, 128, 128, 1)');
		expect(colorParser.gradientColorAtPercent('#fff', '#000', 0.5)).to.be.equal('rgba(128, 128, 128, 1)');
	});

	it('100%', () => {
		expect(colorParser.gradientColorAtPercent('rgb(255, 255, 255)', 'rgb(0, 0, 0)', 1)).to.be.equal('rgba(0, 0, 0, 1)');
		expect(colorParser.gradientColorAtPercent('rgba(255, 255, 255, 1)', 'rgba(0, 0, 0, 0)', 1)).to.be.equal('rgba(0, 0, 0, 0)');
		expect(colorParser.gradientColorAtPercent('#ffffff', '#000000', 1)).to.be.equal('rgba(0, 0, 0, 1)');
		expect(colorParser.gradientColorAtPercent('#fff', '#000', 1)).to.be.equal('rgba(0, 0, 0, 1)');
	});
});
