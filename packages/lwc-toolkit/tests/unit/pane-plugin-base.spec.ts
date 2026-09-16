import { expect } from 'chai';
import { IChartApiBase, PaneAttachedParameter, Time } from 'lightweight-charts';
import { describe, it } from 'node:test';

import { PanePluginBase } from '../../src/pane-plugin-base.js';

class TestPanePlugin extends PanePluginBase {
	public attachedCalls = 0;
	public detachedCalls = 0;

	public update(): void {
		this.requestUpdate();
	}

	public attached(param: PaneAttachedParameter<Time>): void {
		this.attachedCalls++;
		super.attached(param);
	}

	public detached(): void {
		this.detachedCalls++;
		super.detached();
	}
}

function fakeChart(): IChartApiBase<Time> {
	return { id: 'chart' } as unknown as IChartApiBase<Time>;
}

void describe('PanePluginBase', () => {
	void it('throws when the chart is read before the primitive is attached', () => {
		const plugin = new TestPanePlugin();
		expect(() => plugin.chart).to.throw();
	});

	void it('exposes the chart handed over by attached()', () => {
		const plugin = new TestPanePlugin();
		const chart = fakeChart();
		plugin.attached({ chart, requestUpdate: (): void => {} });
		expect(plugin.chart).to.equal(chart);
	});

	void it('requests an initial update when attached', () => {
		const plugin = new TestPanePlugin();
		let updates = 0;
		plugin.attached({ chart: fakeChart(), requestUpdate: (): void => void updates++ });
		expect(updates).to.equal(1);
	});

	void it('forwards requestUpdate() to the callback from attached()', () => {
		const plugin = new TestPanePlugin();
		let updates = 0;
		plugin.attached({ chart: fakeChart(), requestUpdate: (): void => void updates++ });
		plugin.update();
		plugin.update();
		expect(updates).to.equal(3);
	});

	void it('ignores requestUpdate() before attaching and after detaching', () => {
		const plugin = new TestPanePlugin();
		let updates = 0;
		expect(() => plugin.update()).to.not.throw();
		plugin.attached({ chart: fakeChart(), requestUpdate: (): void => void updates++ });
		plugin.detached();
		plugin.update();
		expect(updates).to.equal(1);
	});

	void it('releases the chart on detach', () => {
		const plugin = new TestPanePlugin();
		plugin.attached({ chart: fakeChart(), requestUpdate: (): void => {} });
		plugin.detached();
		expect(() => plugin.chart).to.throw();
	});

	void it('can be re-attached to another chart', () => {
		const plugin = new TestPanePlugin();
		plugin.attached({ chart: fakeChart(), requestUpdate: (): void => {} });
		plugin.detached();
		const second = fakeChart();
		plugin.attached({ chart: second, requestUpdate: (): void => {} });
		expect(plugin.chart).to.equal(second);
		expect(plugin.attachedCalls).to.equal(2);
		expect(plugin.detachedCalls).to.equal(1);
	});
});
