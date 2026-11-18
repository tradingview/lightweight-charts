/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { chartOptionsDefaults } from '../../src/api/options/chart-options-defaults';
import { seriesOptionsDefaults } from '../../src/api/options/series-options-defaults';
import { ChartWidget } from '../../src/gui/chart-widget';
import { ensureNotNull } from '../../src/helpers/assertions';
import { clone } from '../../src/helpers/strict-type-checks';
import { ChartModel, IChartModelBase } from '../../src/model/chart-model';
import { HorzScaleBehaviorTime } from '../../src/model/horz-scale-behavior-time/horz-scale-behavior-time';
import { Time } from '../../src/model/horz-scale-behavior-time/types';
import { ISeries } from '../../src/model/iseries';
import { Pane } from '../../src/model/pane';
import { Series } from '../../src/model/series';
import { SeriesLinePaneView } from '../../src/model/series/line-pane-view';
import { lineStyleDefaults } from '../../src/model/series/line-series';

interface PaneWidgetStub {
	state: () => Pane;
	setState: (pane: Pane | null) => void;
	destroy: () => void;
	getElement: () => object;
	clicked: () => { unsubscribeAll: () => void };
	dblClicked: () => { unsubscribeAll: () => void };
	updatePriceAxisWidgetsStates: () => void;
}

/* eslint-disable @typescript-eslint/naming-convention */
interface WidgetSync {
	_syncGuiWithModel: () => void;
}
/* eslint-enable @typescript-eslint/naming-convention */

function setup(): { model: ChartModel<Time>; widget: WidgetSync; widgets: PaneWidgetStub[]; destroyed: number[] } {
	const model = new ChartModel<Time>(() => {}, chartOptionsDefaults<Time>(), new HorzScaleBehaviorTime());
	const destroyed = [0, 0, 0];
	[0, 1, 2].forEach((paneIndex: number) => {
		const line = new Series(model, 'Line', { ...clone(seriesOptionsDefaults), ...lineStyleDefaults }, (source: ISeries<'Line'>, chart: IChartModelBase) => new SeriesLinePaneView(source, chart));
		const destroy = line.destroy.bind(line);
		line.destroy = () => {
			destroyed[paneIndex]++;
			destroy();
		};
		model.addSeriesToPane(line, paneIndex);
	});
	const widgets = model.panes().map((pane: Pane) => {
		let state: Pane | null = pane;
		return {
			state: () => ensureNotNull(state),
			setState: (next: Pane | null) => { state = next; },
			destroy: () => { state?.destroy(); },
			getElement: () => ({}),
			clicked: () => ({ unsubscribeAll: () => {} }),
			dblClicked: () => ({ unsubscribeAll: () => {} }),
			updatePriceAxisWidgetsStates: () => {},
		};
	});
	const widget = Object.create(ChartWidget.prototype) as WidgetSync;
	/* eslint-disable @typescript-eslint/naming-convention */
	Object.assign(widget, {
		_model: model,
		_paneWidgets: widgets,
		_paneSeparators: [{}, {}],
		_tableElement: { removeChild: () => {} },
		_destroySeparator: () => {},
		_updateTimeAxisVisibility: () => {},
		_adjustSizeImpl: () => {},
	});
	/* eslint-enable @typescript-eslint/naming-convention */
	return { model, widget, widgets, destroyed };
}

describe('Pane widget state ownership', () => {
	for (const removedIndex of [0, 1, 2]) {
		it(`destroys only the removed pane's series at index ${removedIndex}`, () => {
			const { model, widget, destroyed } = setup();
			model.removePane(removedIndex);
			widget._syncGuiWithModel();
			expect(destroyed).to.deep.equal([0, 1, 2].map((i: number) => i === removedIndex ? 1 : 0));
			model.destroy();
			expect(destroyed).to.deep.equal([1, 1, 1]);
		});
	}

	it('reconciles a second removal from the removed primitive callback', () => {
		const { model, widget, widgets, destroyed } = setup();
		const survivor = model.panes()[2];
		model.panes()[0].attachPrimitive({ detached: () => model.removePane(0) });
		model.removePane(0);
		widget._syncGuiWithModel();
		expect(model.panes()).to.deep.equal([survivor]);
		expect(widgets.map((w: PaneWidgetStub) => w.state())).to.deep.equal([survivor]);
		expect(destroyed).to.deep.equal([1, 1, 0]);
		model.destroy();
		expect(destroyed).to.deep.equal([1, 1, 1]);
	});
});
