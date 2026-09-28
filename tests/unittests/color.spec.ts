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

interface BrowserColorState {
	readyState: DocumentReadyState;
	color: string;
	reads: number;
}

function withBrowserColor(callback: (state: BrowserColorState) => void): void {
	const state: BrowserColorState = { readyState: 'loading', color: 'rgb(128, 128, 128)', reads: 0 };
	const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
	const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
	Object.defineProperty(globalThis, 'document', {
		configurable: true,
		value: {
			get readyState(): DocumentReadyState { return state.readyState; },
			createElement: () => ({ style: {} }),
			body: { appendChild: () => {}, removeChild: () => {} },
		},
	});
	Object.defineProperty(globalThis, 'window', {
		configurable: true,
		value: {
			getComputedStyle: () => {
				state.reads++;
				return { color: state.color };
			},
		},
	});
	try {
		callback(state);
	} finally {
		if (originalDocument) {
			Object.defineProperty(globalThis, 'document', originalDocument);
		} else {
			Reflect.deleteProperty(globalThis, 'document');
		}
		if (originalWindow) {
			Object.defineProperty(globalThis, 'window', originalWindow);
		} else {
			Reflect.deleteProperty(globalThis, 'window');
		}
	}
}

describe('browser color caching', () => {
	for (const readyState of ['loading', 'interactive'] as const) {
		it(`does not retain a transient browser color while the document is ${readyState}`, () => {
			withBrowserColor((state: BrowserColorState) => {
				const parser = new ColorParser([]);
				state.readyState = readyState;
				expect(parser.applyAlpha('red', 0.5)).to.equal('rgba(128, 128, 128, 0.5)');
				state.color = 'rgb(255, 0, 0)';
				expect(parser.applyAlpha('red', 0.5)).to.equal('rgba(255, 0, 0, 0.5)');
				expect(state.reads).to.equal(2);
				state.readyState = 'complete';
				expect(parser.applyAlpha('red', 0.5)).to.equal('rgba(255, 0, 0, 0.5)');
				expect(parser.applyAlpha('red', 0.25)).to.equal('rgba(255, 0, 0, 0.25)');
				expect(state.reads).to.equal(3);
			});
		});
	}

	it('caches browser colors immediately after document loading is complete', () => {
		withBrowserColor((state: BrowserColorState) => {
			state.readyState = 'complete';
			state.color = 'rgba(255, 0, 0, 0.5)';
			const parser = new ColorParser([]);
			expect(parser.applyAlpha('red', 0.5)).to.equal('rgba(255, 0, 0, 0.25)');
			expect(parser.applyAlpha('red', 1)).to.equal('rgba(255, 0, 0, 0.5)');
			expect(state.reads).to.equal(1);
		});
	});

	it('preserves explicitly seeded colors during loading', () => {
		withBrowserColor((state: BrowserColorState) => {
			const parser = new ColorParser([], new Map([['red', generateRgba([255, 0, 0, 1])]]));
			expect(parser.applyAlpha('red', 0.5)).to.equal('rgba(255, 0, 0, 0.5)');
			expect(state.reads).to.equal(0);
		});
	});

	it('still caches custom parser results during loading', () => {
		withBrowserColor((state: BrowserColorState) => {
			state.color = 'color(display-p3 1 0 0)';
			let customReads = 0;
			const parser = new ColorParser([() => {
				customReads++;
				return generateRgba([255, 0, 0, 1]);
			}]);
			expect(parser.applyAlpha(state.color, 0.5)).to.equal('rgba(255, 0, 0, 0.5)');
			expect(parser.applyAlpha(state.color, 1)).to.equal('rgba(255, 0, 0, 1)');
			expect(state.reads).to.equal(1);
			expect(customReads).to.equal(1);
		});
	});
});

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
