import { expect } from 'chai';
import { describe, it } from 'node:test';
import { customSeriesDefaultOptions, CustomData, CustomSeriesOptions, CustomSeriesWhitespaceData, DeepPartial, IChartApiBase, ICustomSeriesPaneView, Time } from 'lightweight-charts';
import { createOptionsAwareSeries, OptionsAwareSeries } from '../../src/custom-series/options-aware-series.js';

interface Point extends CustomData<Time> { value: number; tag: string; }
type Datum = Point | CustomSeriesWhitespaceData<Time>;

interface Options extends CustomSeriesOptions { base: number; }

void describe('createOptionsAwareSeries', () => {
	void it('binds initial options and rebuilds data only for price option changes', () => {
		const defaults = { ...customSeriesDefaultOptions, base: 0 };
		let builds = 0;
		let plot: number[] = [];
		let registered: OptionsAwareSeries<Time, Point, Options>;
		const timeKey = (time: Time): number => typeof time === 'string' ? Date.parse(time) : typeof time === 'number' ? time : Date.UTC(time.year, time.month - 1, time.day);
		let suppliedData: Datum[] = [];
		const chart = {
			horzBehaviour: () => ({ key: timeKey }),
			addCustomSeries(view: ICustomSeriesPaneView<Time, Point, Options>, supplied: DeepPartial<Options>) {
				const options = { ...defaults, ...supplied } as Options;
				let data: Datum[] = [];
				const api = {
					options: () => options,
					applyOptions: (next: DeepPartial<Options>) => Object.assign(options, next),
					data: () => data.filter((point): point is Point => 'value' in point),
					update(point: Datum, historical: boolean = false) {
						const index = data.findIndex(item => timeKey(item.time) === timeKey(point.time));
						if (historical && index === -1) { throw new Error('Unknown historical point'); }
						if (index === -1) { data.push(point); } else { data[index] = point; }
					},
					pop(count: number) {
						const removed = data.filter((point): point is Point => 'value' in point).slice(-count).reverse();
						data = data.filter(point => !removed.includes(point as Point));
						return removed;
					},
					setData(next: Datum[]) {
						suppliedData = next;
						data = next.slice();
						builds++;
						const first = next.find((point): point is Point => 'value' in point);
						plot = first ? view.priceValueBuilder(first) : [];
					},
				} as unknown as OptionsAwareSeries<Time, Point, Options>;
				registered = api;
				return api;
			},
		} as unknown as IChartApiBase<Time>;
		const series = createOptionsAwareSeries<Time, Point, Options>(chart, readOptions => ({
			priceValueBuilder: (point: Point) => [readOptions().base, point.value],
		}) as ICustomSeriesPaneView<Time, Point, Options>, defaults, { base: 100 }, ['base']);
		expect(series).to.equal(registered!);
		series.setData([{ time: '2024-01-01', value: 30, tag: 'retained' }]);
		expect(plot).to.deep.equal([100, 30]);
		series.applyOptions({ base: -50 });
		expect(plot).to.deep.equal([-50, 30]);
		expect(builds).to.equal(2);
		expect(series.data()[0]).to.have.property('tag', 'retained');
		series.applyOptions({ color: '#f00' });
		series.applyOptions({ base: -50 });
		expect(builds).to.equal(2);

		series.setData([
			{ time: '2024-01-01' },
			{ time: '2024-01-02', value: 2, tag: 'original' },
			{ time: '2024-01-03' },
		]);
		series.update({ time: { year: 2024, month: 1, day: 2 }, value: 20, tag: 'historical' }, true);
		series.update({ time: '2024-01-04', value: 4, tag: 'streamed' });
		series.applyOptions({ base: 10 });
		expect(suppliedData).to.have.length(4);
		expect(suppliedData[0]).to.deep.equal({ time: '2024-01-01' });
		expect(suppliedData[1]).to.have.property('tag', 'historical');
		expect(suppliedData[2]).to.deep.equal({ time: '2024-01-03' });
		expect(series.pop(1)[0]).to.have.property('tag', 'streamed');
		expect(() => series.update({ time: '2023-01-01', value: 1, tag: 'invalid' }, true)).to.throw();
		series.applyOptions({ base: 20 });
		expect(suppliedData).to.have.length(3);
		expect(suppliedData.map(point => timeKey(point.time))).to.deep.equal([
			timeKey('2024-01-01'), timeKey('2024-01-02'), timeKey('2024-01-03'),
		]);
		series.setData([]);
		series.applyOptions({ base: 30 });
		expect(series.data()).to.deep.equal([]);
	});
});
