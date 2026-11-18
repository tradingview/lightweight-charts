import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

import { changeRange, clampRange } from '../../plugin-examples/src/plugins/chart-navigator/range';

void describe('chart navigator ranges', () => {
	void it('preserves fractional spans when moving at either boundary', () => {
		assert.deepEqual(clampRange({ from: -12.5, to: 27.75 }, 299, 1), { from: 0, to: 40.25 });
		assert.deepEqual(clampRange({ from: 280.5, to: 320.75 }, 299, 1), { from: 258.75, to: 299 });
	});
	void it('limits oversized and empty ranges', () => {
		assert.deepEqual(clampRange({ from: -50, to: 400 }, 299, 1), { from: 0, to: 299 });
		assert.deepEqual(clampRange({ from: 12, to: 12 }, 299, 1), { from: 12, to: 13 });
	});
	void it('moves a window without changing its span', () => {
		assert.deepEqual(changeRange({ from: 20, to: 40 }, 'move', 12.5, 299, 1), { from: 32.5, to: 52.5 });
		assert.deepEqual(changeRange({ from: 20, to: 40 }, 'move', -100, 299, 1), { from: 0, to: 20 });
	});
	void it('prevents handles crossing or leaving the dataset', () => {
		assert.deepEqual(changeRange({ from: 20, to: 40 }, 'from', 1000, 299, 1), { from: 39, to: 40 });
		assert.deepEqual(changeRange({ from: 20, to: 40 }, 'from', -1000, 299, 1), { from: 0, to: 40 });
		assert.deepEqual(changeRange({ from: 20, to: 40 }, 'to', -1000, 299, 1), { from: 20, to: 21 });
		assert.deepEqual(changeRange({ from: 20, to: 40 }, 'to', 1000, 299, 1), { from: 20, to: 299 });
	});
	void it('supports the smallest two-point dataset', () => {
		assert.deepEqual(changeRange({ from: 0, to: 1 }, 'move', 1000, 1, 1), { from: 0, to: 1 });
		assert.deepEqual(changeRange({ from: 0, to: 1 }, 'from', 1000, 1, 1), { from: 0, to: 1 });
		assert.deepEqual(changeRange({ from: 0, to: 1 }, 'to', -1000, 1, 1), { from: 0, to: 1 });
	});
	void it('keeps ordered bounds for a deterministic sweep of all actions', () => {
		for (let from = 0; from < 99; from += 3.25) {
			for (const delta of [-1000, -10.75, 0, 2.5, 1000]) {
				for (const action of ['from', 'to', 'move'] as const) {
					const range = changeRange({ from, to: from + 1.5 }, action, delta, 100, 1);
					assert.ok(range.from >= 0 && range.to <= 100 && range.to - range.from >= 1);
					if (action === 'move') {
						assert.equal(range.to - range.from, 1.5);
					}
				}
			}
		}
	});
});
