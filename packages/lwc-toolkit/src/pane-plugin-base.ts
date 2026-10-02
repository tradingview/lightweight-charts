import {
	IChartApiBase,
	IPanePrimitive,
	PaneAttachedParameter,
	Time,
} from 'lightweight-charts';

import { ensureDefined } from './assertions.js';

/**
 * Base class for pane primitives, the pane-level counterpart of `PluginBase`.
 *
 * It holds the chart reference and the `requestUpdate` callback handed over by
 * the library in `attached`, so a primitive only has to implement its views.
 * Subclasses which override `attached` / `detached` must call `super.attached(param)`
 * / `super.detached()`, otherwise `chart` throws and `requestUpdate()` does nothing.
 *
 * Reading `chart` before the primitive has been attached (or after it has been
 * detached) throws, so the getter can be used without a null check everywhere a
 * view is drawn.
 */
export abstract class PanePluginBase<T = Time> implements IPanePrimitive<T> {
	private _chart: IChartApiBase<T> | undefined = undefined;
	private _requestUpdate: (() => void) | undefined = undefined;

	/** The chart the primitive is attached to. Throws while the primitive is not attached. */
	public get chart(): IChartApiBase<T> {
		return ensureDefined(this._chart);
	}

	/** Attached lifecycle hook: keeps the chart and the update callback. */
	public attached({ chart, requestUpdate }: PaneAttachedParameter<T>): void {
		this._chart = chart;
		this._requestUpdate = requestUpdate;
		this.requestUpdate();
	}

	/** Detached lifecycle hook: releases everything taken in {@link attached}. */
	public detached(): void {
		this._chart = undefined;
		this._requestUpdate = undefined;
	}

	/** Asks the chart to redraw. Does nothing while the primitive is not attached. */
	protected requestUpdate(): void {
		if (this._requestUpdate) {
			this._requestUpdate();
		}
	}
}
