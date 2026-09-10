import { expect } from 'chai';
import { describe, it } from 'node:test';
import { customSeriesDefaultOptions, CustomData, CustomSeriesOptions, CustomSeriesWhitespaceData, DataChangedHandler, DeepPartial, IChartApiBase, ICustomSeriesPaneView, Time } from 'lightweight-charts';
import { createOptionsAwareSeries, OptionsAwareSeries } from '../../src/custom-series/options-aware-series.js';
import { convertTimeUTC } from '../../src/time.js';

interface Point extends CustomData<Time> { value: number; tag?: string; }
type Datum = Point | CustomSeriesWhitespaceData<Time>;
interface Options extends CustomSeriesOptions { base: number; }
const point = (day: number, value: number = day): Point => ({ time: `2024-01-0${day}`, value });

/** Models the host's commit-before-notification ordering, including nested listeners. */
function fixture() {
	const defaults = { ...customSeriesDefaultOptions, base: 0 };
	let builds = 0;
	let plot: number[] = [];
	let suppliedData: Datum[] = [];
	let registered: OptionsAwareSeries<Time, Point, Options> | undefined;
	let readInput: () => readonly Datum[] = () => [];
	const listeners = new Set<DataChangedHandler>();
	const notify = (scope: 'full' | 'update'): void => { for (const listener of listeners) { listener(scope); } };
	const chart = {
		horzBehaviour: () => ({ key: convertTimeUTC }),
		addCustomSeries(view: ICustomSeriesPaneView<Time, Point, Options>, supplied: DeepPartial<Options>) {
			const options = { ...defaults, ...supplied } as Options;
			let data: Datum[] = [];
			const api = {
				options: () => options,
				applyOptions: (next: DeepPartial<Options>) => Object.assign(options, next),
				subscribeDataChanged: (handler: DataChangedHandler) => listeners.add(handler),
				unsubscribeDataChanged: (handler: DataChangedHandler) => listeners.delete(handler),
				data: () => data.filter((item): item is Point => 'value' in item),
				update(item: Datum, historical: boolean = false) {
					const time = convertTimeUTC(item.time);
					const index = data.findIndex(entry => convertTimeUTC(entry.time) === time);
					if (historical && index === -1) { throw new Error('Unknown historical point'); }
					if (index === -1) { data.push(item); } else { data[index] = item; }
					notify('update');
				},
				pop(count: number) {
					if (count <= 0) { return []; }
					const removed = data.filter((item): item is Point => 'value' in item).slice(-count).reverse();
					data = data.filter(item => !removed.includes(item as Point));
					if (removed.length > 0) { notify('update'); }
					return removed;
				},
				setData(next: Datum[]) {
					if (next.some((item, i) => i > 0 && convertTimeUTC(item.time) <= convertTimeUTC(next[i - 1].time))) {
						throw new Error('Unsorted data');
					}
					suppliedData = next;
					data = next.slice();
					builds++;
					const first = next.find((item): item is Point => 'value' in item);
					plot = first ? view.priceValueBuilder(first) : [];
					notify('full');
				},
			} as unknown as OptionsAwareSeries<Time, Point, Options>;
			registered = api;
			return api;
		},
	} as unknown as IChartApiBase<Time>;
	const series = createOptionsAwareSeries<Time, Point, Options>(chart, (readOptions, readData) => {
		readInput = readData;
		return {
			priceValueBuilder: (item: Point) => [readOptions().base, item.value],
		} as ICustomSeriesPaneView<Time, Point, Options>;
	}, defaults, { base: 100 }, ['base']);
	return { series, registered, readInput: () => readInput(), get builds() { return builds; }, get plot() { return plot; }, get input() { return suppliedData; } };
}

void describe('createOptionsAwareSeries', () => {
	void it('binds initial options and retains the registered series identity', () => {
		const f = fixture();
		expect(f.series).to.equal(f.registered);
		f.series.setData([point(1, 30)]);
		expect(f.plot).to.deep.equal([100, 30]);
		f.series.applyOptions({ base: -50 });
		expect(f.plot).to.deep.equal([-50, 30]);
		f.series.applyOptions({ color: '#f00' });
		f.series.applyOptions({ base: -50 });
		expect(f.builds).to.equal(2);
	});

	void it('preserves whitespace, custom fields and historical/streaming updates', () => {
		const f = fixture();
		f.series.setData([{ time: '2024-01-01' }, point(2), { time: '2024-01-03' }]);
		f.series.update({ time: { year: 2024, month: 1, day: 2 }, value: 20, tag: 'kept' }, true);
		f.series.update(point(4));
		f.series.applyOptions({ base: 10 });
		expect(f.input).to.have.length(4);
		expect(f.input[0]).to.deep.equal({ time: '2024-01-01' });
		expect(f.input[1]).to.have.property('tag', 'kept');
		expect(f.input[2]).to.deep.equal({ time: '2024-01-03' });
		f.series.pop(1);
		f.series.applyOptions({ base: 20 });
		expect(f.input).to.have.length(3);
		f.series.setData([]);
		f.series.applyOptions({ base: 30 });
		expect(f.series.data()).to.deep.equal([]);
	});

	void it('does not cache rejected setData or historical updates', () => {
		const { series } = fixture();
		series.setData([point(1)]);
		expect(() => series.update(point(2), true)).to.throw('Unknown historical point');
		expect(() => series.setData([point(3), point(2)])).to.throw('Unsorted data');
		series.applyOptions({ base: 10 });
		expect(series.data()).to.deep.equal([point(1)]);
	});

	for (const operation of ['setData', 'update', 'pop'] as const) {
		void it(`keeps committed ${operation} data when an application listener throws`, () => {
			const { series } = fixture();
			series.setData([point(1), point(2)]);
			const fail = (): void => { throw new Error('application failure'); };
			series.subscribeDataChanged(fail);
			expect(() => {
				if (operation === 'setData') { series.setData([point(3)]); }
				else if (operation === 'update') { series.update(point(3)); }
				else { series.pop(1); }
			}).to.throw('application failure');
			series.unsubscribeDataChanged(fail);
			const committed = series.data();
			series.applyOptions({ base: 10 });
			expect(series.data()).to.deep.equal(committed);
		});
	}

	void it('preserves a replacement written inside a pop callback', () => {
		const { series } = fixture();
		series.setData([point(1), point(2)]);
		const replace = (): void => {
			series.unsubscribeDataChanged(replace);
			series.update(point(2, 200));
			series.applyOptions({ base: 20 });
		};
		series.subscribeDataChanged(replace);
		series.pop(1);
		expect(series.data()).to.deep.equal([point(1), point(2, 200)]);
	});
});

void describe('retained input snapshots', () => {
	void it('shares a lazy snapshot and commits before consumer callbacks', () => {
		const f = fixture();
		f.series.setData([point(1), { time: '2024-01-02' }, point(3)]);
		const first = f.readInput();
		expect(f.readInput()).to.equal(first);
		let observed: readonly Datum[] = [];
		f.series.subscribeDataChanged(() => { observed = f.readInput(); });
		f.series.update(point(2), true);
		expect(observed).to.deep.equal([point(1), point(2), point(3)]);
		expect(observed).to.not.equal(first);
		f.series.pop(1);
		expect(f.readInput()).to.deep.equal([point(1), point(2)]);
		expect(() => f.series.setData([point(3), point(2)])).to.throw('Unsorted data');
		expect(f.readInput()).to.deep.equal([point(1), point(2)]);
		f.series.setData([]);
		expect(f.readInput()).to.deep.equal([]);
	});
});
