import { expect } from 'chai';
import { describe, it } from 'node:test';
import type { IChartApiBase, ISeriesApi, SeriesType, Time } from 'lightweight-charts';

import { isChartRemoved, isSeriesAttached } from '../../src/chart/lifecycle.js';

type Series = ISeriesApi<SeriesType, Time>;

function series(): Series {
	return { seriesType: () => 'Line' } as unknown as Series;
}

/** A chart whose panes hold `panes`, or which throws when asked once `throws` is set. */
function chart(panes: Series[][], throws: boolean = false): IChartApiBase<Time> {
	return {
		panes: () => {
			if (throws) {
				throw new Error('Value is null');
			}
			return panes.map((list: Series[]) => ({ getSeries: () => list }));
		},
	} as unknown as IChartApiBase<Time>;
}

void describe('isChartRemoved', () => {
	void it('is false while the chart has a pane', () => {
		expect(isChartRemoved(chart([[]]))).to.equal(false);
	});

	void it('is true once the chart has no panes, or throws when asked', () => {
		expect(isChartRemoved(chart([]))).to.equal(true);
		expect(isChartRemoved(chart([[]], true))).to.equal(true);
	});
});

void describe('isSeriesAttached', () => {
	void it('finds the series in any pane', () => {
		const a = series();
		const b = series();
		const host = chart([[a], [], [b]]);
		expect(isSeriesAttached(host, a)).to.equal(true);
		expect(isSeriesAttached(host, b)).to.equal(true);
	});

	void it('is false for a series taken off the chart, and on a removed chart', () => {
		const a = series();
		expect(isSeriesAttached(chart([[series()]]), a)).to.equal(false);
		expect(isSeriesAttached(chart([]), a)).to.equal(false);
		expect(isSeriesAttached(chart([[a]], true), a)).to.equal(false);
	});
});
