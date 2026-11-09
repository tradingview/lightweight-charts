import { expect } from 'chai';
import { describe, it } from 'node:test';
import type {
	CustomConflationContext,
	CustomData,
	CustomSeriesHitTestResult as LibraryHitTestResult,
	Time,
} from 'lightweight-charts';

import type { ConflationContext, CustomSeriesHitTestResult } from '../../src/custom-series/compat.js';

// The structural copies have to stay interchangeable with the library's own
// types, which the workspace build of the library exports. The assignments
// below fail to compile (`pnpm typecheck`) when they drift apart.

interface TestData extends CustomData<Time> {
	value: number;
}

void describe('custom-series compat types', () => {
	void it('match the library hit test result both ways', () => {
		const ours: CustomSeriesHitTestResult = { distance: 2, objectId: 'bar-1', type: 'range', cursorStyle: 'pointer', hitTestData: 1 };
		const library: LibraryHitTestResult = ours;
		const back: CustomSeriesHitTestResult = library;
		expect(back).to.equal(ours);
	});

	void it('accept the library conflation context', () => {
		const library = { data: { time: 1 as Time, value: 3 } } as CustomConflationContext<Time, TestData>;
		const ours: ConflationContext<TestData> = library;
		expect(ours.data.value).to.equal(3);
	});
});
