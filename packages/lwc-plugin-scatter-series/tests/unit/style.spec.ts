import { expect } from 'chai';
import { describe, it } from 'node:test';

import type { ScatterPoint } from '../../src/data.js';
import { DEFAULT_SCATTER_PALETTE, defaultOptions } from '../../src/options.js';
import {
	ScatterStyleOptions,
	describeGroup,
	outlineWidth,
	resolveGroups,
	resolvePointStyle,
	resolveSeriesStyle,
	strokeColorOf,
	withGroupVisibility,
} from '../../src/style.js';
import { type SizeScaling, cappedStrokeWidth } from '../../src/size.js';

const styleOptions: ScatterStyleOptions = {
	color: '#2962FF',
	opacity: 0.65,
	pointSize: 9,
	pointSizeLimits: { min: 5, max: 50 },
	shape: 'circle',
	palette: ['#111111', '#222222', '#333333'],
	strokeColor: null,
	strokeWidth: 1,
	hollow: false,
};
const options = resolveSeriesStyle(styleOptions);

const scaling: SizeScaling = { domain: { min: 0, max: 10 }, range: { min: 5, max: 25 }, scale: 'linear' };

void describe('resolveGroups', () => {
	void it('keeps the declared order and appends undeclared groups in order of appearance', () => {
		const points: ScatterPoint[] = [
			{ x: 0, y: 0, group: 'c' },
			{ x: 0, y: 0, group: 'b' },
			{ x: 0, y: 0 },
			{ x: 0, y: 0, group: 'd' },
			{ x: 0, y: 0, group: 'c' },
		];
		const groups = resolveGroups([{ id: 'a' }, { id: 'b' }], points, options);
		expect(groups.map(group => [group.id, group.index, group.declared])).to.deep.equal([
			['a', 0, true],
			['b', 1, true],
			['c', 2, false],
			['d', 3, false],
		]);
	});

	void it('colours groups without a colour from the palette by position', () => {
		const groups = resolveGroups([{ id: 'a' }, { id: 'b', color: 'red' }, { id: 'c' }, { id: 'd' }], [], options);
		expect(groups.map(group => group.color)).to.deep.equal(['#111111', 'red', '#333333', '#111111']);
	});

	void it('gives a single group of the default palette the default point colour', () => {
		const [group] = resolveGroups([{ id: 'only' }], [], resolveSeriesStyle(defaultOptions));
		expect(DEFAULT_SCATTER_PALETTE).to.have.length(10);
		expect(group.color).to.equal(defaultOptions.color);
		expect(group.color).to.equal('#2962FF');
	});

	void it('falls back to the series colour with an empty palette', () => {
		const groups = resolveGroups([{ id: 'a' }], [], resolveSeriesStyle({ ...styleOptions, palette: [] }));
		expect(groups[0].color).to.equal('#2962FF');
	});

	void it('draws the points of a group with lines opaque unless the group says otherwise', () => {
		const groups = resolveGroups([
			{ id: 'plain' },
			{ id: 'lines', lineVisible: true },
			{ id: 'faded lines', lineVisible: true, opacity: 0.3 },
		], [], options);
		expect(groups.map(group => group.opacity)).to.deep.equal([0.65, 1, 0.3]);
	});

	void it('fills in the defaults of a group', () => {
		const [group] = resolveGroups([{ id: 'a', pointSize: 80 }], [], options);
		expect(group).to.include({
			name: 'a',
			shape: 'circle',
			pointSize: 50,
			strokeColor: null,
			strokeWidth: 1,
			hollow: false,
			visible: true,
			lineVisible: false,
			lineWidth: 1,
			lineColor: '#111111',
			lineStyle: 0,
		});
	});
});

void describe('resolvePointStyle', () => {
	const [group] = resolveGroups([{ id: 'g', color: 'green', opacity: 0.4, shape: 'diamond', pointSize: 12 }], [], options);

	void it('takes the series options for a point without group or overrides', () => {
		expect(resolvePointStyle({ x: 0, y: 0 }, null, options, null)).to.deep.equal({
			color: '#2962FF',
			opacity: 0.65,
			size: 9,
			shape: 'circle',
			strokeColor: null,
			strokeWidth: 1,
			hollow: false,
		});
	});

	void it('takes the group over the series options', () => {
		expect(resolvePointStyle({ x: 0, y: 0, group: 'g' }, group, options, null)).to.deep.equal({
			color: 'green',
			opacity: 0.4,
			size: 12,
			shape: 'diamond',
			strokeColor: null,
			strokeWidth: 1,
			hollow: false,
		});
	});

	void it('takes the point over its group', () => {
		const style = resolvePointStyle({ x: 0, y: 0, group: 'g', color: 'red', opacity: 1, size: 30 }, group, options, null);
		expect(style).to.include({ color: 'red', opacity: 1, size: 30, shape: 'diamond' });
	});

	void it('sizes by value over the group size, and by size over the value', () => {
		expect(resolvePointStyle({ x: 0, y: 0, sizeValue: 10 }, group, options, scaling).size).to.equal(25);
		expect(resolvePointStyle({ x: 0, y: 0, sizeValue: 10, size: 7 }, group, options, scaling).size).to.equal(7);
		expect(resolvePointStyle({ x: 0, y: 0, sizeValue: 10 }, group, options, null).size).to.equal(12);
		expect(resolvePointStyle({ x: 0, y: 0, sizeValue: Number.NaN }, group, options, scaling).size).to.equal(12);
	});

	void it('always clamps the size and the opacity', () => {
		expect(resolvePointStyle({ x: 0, y: 0, size: 2 }, null, options, null).size).to.equal(5);
		expect(resolvePointStyle({ x: 0, y: 0, size: 99 }, null, options, null).size).to.equal(50);
		expect(resolvePointStyle({ x: 0, y: 0 }, null, resolveSeriesStyle({ ...styleOptions, pointSize: 1 }), null).size).to.equal(5);
		expect(resolvePointStyle({ x: 0, y: 0, opacity: 3 }, null, options, null).opacity).to.equal(1);
		expect(resolvePointStyle({ x: 0, y: 0, opacity: Number.NaN }, group, options, null).opacity).to.equal(0.4);
	});
});

void describe('resolveSeriesStyle', () => {
	void it('normalises the size limits and clamps the point size to them', () => {
		const style = resolveSeriesStyle({ ...styleOptions, pointSize: 1, pointSizeLimits: { min: 2, max: 3 } });
		expect(style.limits).to.deep.equal({ min: 2, max: 3 });
		expect(style.pointSize).to.equal(2);
		expect(resolveSeriesStyle({ ...styleOptions, pointSizeLimits: { min: 60, max: 40 } }).pointSize).to.equal(40);
	});

	void it('checks the stroke options', () => {
		expect(resolveSeriesStyle({ ...styleOptions, strokeWidth: -2 }).strokeWidth).to.equal(0);
		expect(resolveSeriesStyle({ ...styleOptions, strokeWidth: Number.NaN }).strokeWidth).to.equal(0);
		expect(resolveSeriesStyle({ ...styleOptions, strokeColor: '#000000', hollow: true })).to.include({
			strokeColor: '#000000',
			hollow: true,
		});
	});
});

void describe('size limits', () => {
	const series = resolveSeriesStyle({ ...styleOptions, pointSizeLimits: { min: 2, max: 12 } });
	const [group] = resolveGroups([{ id: 'g', pointSize: 40 }], [], series);
	const tinyScaling: SizeScaling = { domain: { min: 0, max: 10 }, range: { min: 2, max: 3 }, scale: 'linear' };

	void it('apply to the series, group and point sizes', () => {
		expect(group.pointSize).to.equal(12);
		expect(resolvePointStyle({ x: 0, y: 0, size: 1 }, null, series, null).size).to.equal(2);
		expect(resolvePointStyle({ x: 0, y: 0, size: 2.5 }, null, series, null).size).to.equal(2.5);
		expect(resolvePointStyle({ x: 0, y: 0, size: 99 }, group, series, null).size).to.equal(12);
		expect(resolvePointStyle({ x: 0, y: 0 }, group, series, null).size).to.equal(12);
	});

	void it('leave a size mapped from a value within the range', () => {
		expect(resolvePointStyle({ x: 0, y: 0, sizeValue: 5 }, null, series, tinyScaling).size).to.equal(2.5);
	});
});

void describe('shape, stroke and hollow precedence', () => {
	const series = resolveSeriesStyle({ ...styleOptions, shape: 'square', strokeColor: '#AAAAAA', strokeWidth: 2 });
	const groups = resolveGroups([
		{ id: 'plain' },
		{ id: 'styled', shape: 'diamond', strokeColor: '#BBBBBB', strokeWidth: 3, hollow: true },
		{ id: 'auto', strokeColor: null },
	], [], series);
	const [plain, styled, auto] = groups;

	void it('takes the group over the series options', () => {
		expect(plain).to.include({ shape: 'square', strokeColor: '#AAAAAA', strokeWidth: 2, hollow: false });
		expect(styled).to.include({ shape: 'diamond', strokeColor: '#BBBBBB', strokeWidth: 3, hollow: true });
		// `null` on a group asks for the automatic colour, over the series' colour.
		expect(auto.strokeColor).to.equal(null);
	});

	void it('takes the point over its group', () => {
		const point = { x: 0, y: 0, shape: 'triangleUp' as const, strokeColor: '#CCCCCC', strokeWidth: 0.5, hollow: false };
		expect(resolvePointStyle(point, styled, series, null)).to.include({
			shape: 'triangleUp',
			strokeColor: '#CCCCCC',
			strokeWidth: 0.5,
			hollow: false,
		});
		expect(resolvePointStyle({ x: 0, y: 0, strokeColor: null }, plain, series, null).strokeColor).to.equal(null);
		expect(resolvePointStyle({ x: 0, y: 0, shape: 'triangleDown' }, null, series, null).shape).to.equal('triangleDown');
	});

	void it('inherits what the point does not set, a stroke width that is not a number included', () => {
		expect(resolvePointStyle({ x: 0, y: 0 }, styled, series, null)).to.include({
			shape: 'diamond',
			strokeColor: '#BBBBBB',
			strokeWidth: 3,
			hollow: true,
		});
		expect(resolvePointStyle({ x: 0, y: 0, strokeWidth: Number.NaN }, plain, series, null).strokeWidth).to.equal(2);
		expect(resolvePointStyle({ x: 0, y: 0, strokeWidth: -1 }, plain, series, null).strokeWidth).to.equal(0);
	});

	void it('draws the outline of a hollow point at least 1 px wide', () => {
		expect(resolvePointStyle({ x: 0, y: 0, hollow: true, strokeWidth: 0 }, plain, series, null).strokeWidth).to.equal(1);
		expect(resolvePointStyle({ x: 0, y: 0, hollow: true, strokeWidth: 2.5 }, plain, series, null).strokeWidth).to.equal(2.5);
		expect(outlineWidth(0, true)).to.equal(1);
		expect(outlineWidth(0, false)).to.equal(0);
	});

	void it('resolves the automatic stroke colour: the background, or the point colour when hollow', () => {
		expect(strokeColorOf({ strokeColor: null, hollow: false, color: 'red' }, 'white')).to.equal('white');
		expect(strokeColorOf({ strokeColor: null, hollow: true, color: 'red' }, 'white')).to.equal('red');
		expect(strokeColorOf({ strokeColor: 'black', hollow: true, color: 'red' }, 'white')).to.equal('black');
	});
});

void describe('describeGroup', () => {
	const series = resolveSeriesStyle({ ...styleOptions, pointSizeLimits: { min: 1, max: 50 }, strokeWidth: 3 });
	const groups = resolveGroups([
		{ id: 'big', pointSize: 20 },
		{ id: 'small', pointSize: 6 },
		{ id: 'open', pointSize: 9, hollow: true, strokeWidth: 0 },
		{ id: 'tiny open', pointSize: 2, hollow: true, strokeWidth: 0 },
		{ id: 'ringed', pointSize: 2, strokeColor: '#000000' },
	], [], series);
	const described = groups.map(group => describeGroup(group, 4, '#FFFFFF'));

	void it('reports the ring as drawn on a point of the group size: at most a quarter of it', () => {
		expect(described.map(group => group.strokeWidth)).to.deep.equal([3, 1.5, 1, 0.5, 0.5]);
	});

	void it('matches what pointById reports for a point of the group without a size of its own', () => {
		groups.forEach((group, index) => {
			const style = resolvePointStyle({ x: 0, y: 0, group: group.id }, group, series, null);
			expect(style.size).to.equal(described[index].pointSize);
			expect(cappedStrokeWidth(style.size, style.strokeWidth)).to.equal(described[index].strokeWidth);
		});
	});

	void it('resolves the automatic ring colour and keeps the rest of the group', () => {
		expect(described.map(group => group.strokeColor)).to.deep.equal(['#FFFFFF', '#FFFFFF', '#333333', '#111111', '#000000']);
		expect(described[0]).to.include({ id: 'big', name: 'big', color: '#111111', pointSize: 20, hollow: false, visible: true, pointCount: 4 });
	});
});

void describe('withGroupVisibility', () => {
	const points: ScatterPoint[] = [{ x: 0, y: 0, group: 'a' }, { x: 1, y: 1, group: 'u1' }, { x: 2, y: 2, group: 'u2' }];
	const declared = [{ id: 'a', color: '#AA0000' }];
	const resolved = resolveGroups(declared, points, options);

	void it('hides and shows a declared group, keeping its other fields', () => {
		const hidden = withGroupVisibility(declared, resolved, 'a', false);
		expect(hidden).to.deep.equal([{ id: 'a', color: '#AA0000', visible: false }]);
		expect(withGroupVisibility(hidden ?? [], resolved, 'a', true)).to.deep.equal([{ id: 'a', color: '#AA0000', visible: true }]);
	});

	void it('changes nothing for a group already so, or unknown, or undeclared and shown', () => {
		expect(withGroupVisibility(declared, resolved, 'a', true)).to.equal(null);
		expect(withGroupVisibility(declared, resolved, 'nope', false)).to.equal(null);
		expect(withGroupVisibility(declared, resolved, 'u2', true)).to.equal(null);
	});

	void it('declares an undeclared group being hidden, with the undeclared ones before it', () => {
		const next = withGroupVisibility(declared, resolved, 'u2', false);
		expect(next).to.deep.equal([{ id: 'a', color: '#AA0000' }, { id: 'u1' }, { id: 'u2', visible: false }]);
		// The palette colours stay where they were.
		const after = resolveGroups(next ?? [], points, options);
		expect(after.map((group: { color: string }) => group.color)).to.deep.equal(resolved.map((group: { color: string }) => group.color));
	});
});
