/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { size } from 'fancy-canvas';
import { describe, it } from 'node:test';

import { canvasBitmapSize } from '../../src/gui/canvas-utils';

describe('canvasBitmapSize', () => {
	it('should use the observed bitmap size of a rendered canvas, not client size times ratio', () => {
		expect(canvasBitmapSize(size({ width: 601, height: 301 }), size({ width: 300, height: 150 }), 2)).to.deep.equal({ width: 601, height: 301 });
	});

	it('should size a canvas that is not rendered for the pixel ratio', () => {
		expect(canvasBitmapSize(size({ width: 0, height: 0 }), size({ width: 301, height: 151 }), 1.25)).to.deep.equal({ width: 376, height: 189 });
	});
});
