import { expect } from 'chai';
import { describe, it } from 'node:test';
import type { ISeriesApi, SeriesType, Time } from 'lightweight-charts';

import { supportsSeriesOrder } from '../../src/chart/compat.js';

// The narrowed type has to stay interchangeable with the library's own
// method, which the workspace build of the library declares. The assignments
// below fail to compile (`pnpm typecheck`) when they drift apart.
type Narrowed = { setSeriesOrder(order: number): void };
type LibrarySetSeriesOrder = ISeriesApi<SeriesType, Time>['setSeriesOrder'];

void describe('supportsSeriesOrder', () => {
	void it('is true for a series with setSeriesOrder, as on 5.0.6 and later', () => {
		const calls: number[] = [];
		const series = { setSeriesOrder: (order: number) => calls.push(order) };
		expect(supportsSeriesOrder(series)).to.equal(true);
	});

	void it('is false for a series without it, as on 5.0.0 to 5.0.5, or with a non-function in its place', () => {
		expect(supportsSeriesOrder({ seriesType: () => 'Custom' })).to.equal(false);
		expect(supportsSeriesOrder({ setSeriesOrder: 0 })).to.equal(false);
	});

	void it('narrows a custom series of any horizontal scale item so the call stays typed', () => {
		const calls: number[] = [];
		const series = {
			seriesType: () => 'Custom',
			setSeriesOrder: (order: number) => calls.push(order),
		} as unknown as ISeriesApi<'Custom', number>;
		if (supportsSeriesOrder(series)) {
			series.setSeriesOrder(0);
		}
		expect(calls).to.deep.equal([0]);
	});

	void it('matches the library method both ways', () => {
		const library: LibrarySetSeriesOrder = (_order: number) => undefined;
		const ours: Narrowed['setSeriesOrder'] = library;
		const back: LibrarySetSeriesOrder = ours;
		expect(back).to.equal(library);
	});
});
