import type { MouseEventParams } from 'lightweight-charts';
import { Delegate } from '@tradingview/lwc-toolkit/delegate';
import type { CoalescedTask, createCoalescedTask } from '@tradingview/lwc-toolkit/scheduling/coalesced-task';

import type { ScatterPoint, ScatterPointInfo } from './data';
import type { ScatterModel } from './model';

/*
 Which point is hovered: the one under the pointer, as the chart reports it in
 its crosshair events (from the renderer's hit test), else the one set through
 the API. Subscribers learn of changes after the chart has painted them: the
 chart applies a new visible range and price range on its next frame, so a
 notification is queued with `requestAnimationFrame` after the chart's own
 frame request, and runs right after that paint. Changes the chart paints are
 notified from the paint itself (the series' `drawn` hook); the queue covers
 those it does not, such as hiding the series.
 */

/** What the hover controller reads from its series. */
export interface HoverHost<TPoint extends ScatterPoint> {
	/** The current model. */
	model(): ScatterModel<TPoint>;
	/** The underlying series, which the chart's crosshair events name. */
	series(): unknown;
	/** The hovered point as the API reports it, or `null`. */
	hoveredPoint(): ScatterPointInfo<TPoint> | null;
}

/** The point under the pointer, as the chart reported it. */
interface PointerHover {
	/** Its `objectId`. */
	id: string;
	/** Its data index: the point actually hit, should several share the id. */
	index: number;
}

/** The fields of a point info, every one of them (the type says so): two infos are the same when all are equal. */
const POINT_INFO_KEYS = Object.keys({
	objectId: true,
	point: true,
	index: true,
	groupId: true,
	x: true,
	y: true,
	radius: true,
	color: true,
	opacity: true,
	shape: true,
	hollow: true,
	strokeColor: true,
	strokeWidth: true,
} satisfies Record<keyof ScatterPointInfo, true>) as (keyof ScatterPointInfo)[];

/** Whether two point infos describe the same point, drawn the same way. */
function samePointInfo(a: ScatterPointInfo | null, b: ScatterPointInfo | null): boolean {
	if (a === null || b === null) {
		return a === b;
	}
	return POINT_INFO_KEYS.every((key: keyof ScatterPointInfo) => a[key] === b[key]);
}

/** The hovered point of a scatter series, and its subscribers. */
export class HoverController<TPoint extends ScatterPoint> {
	readonly #host: HoverHost<TPoint>;
	readonly #changed: Delegate<ScatterPointInfo<TPoint> | null> = new Delegate();
	readonly #notification: CoalescedTask;
	#pointer: PointerHover | null = null;
	#lastHit: { model: ScatterModel<TPoint>; index: number } | null = null;
	#apiId: string | null = null;
	#notified: ScatterPointInfo<TPoint> | null = null;

	public constructor(host: HoverHost<TPoint>, task: typeof createCoalescedTask) {
		this.#host = host;
		this.#notification = task(() => this.notify(), (callback: () => void) => requestAnimationFrame(callback));
	}

	/** Data index of the hovered point: under the pointer, else set through the API; only while it is drawn. */
	public index(): number | null {
		const model = this.#host.model();
		const pointer = this.#pointer;
		if (pointer !== null) {
			const index = model.resolved[pointer.index]?.id === pointer.id ? pointer.index : model.idToIndex.get(pointer.id);
			if (index !== undefined && model.resolved[index].visible) {
				return index;
			}
		}
		if (this.#apiId !== null) {
			const index = model.idToIndex.get(this.#apiId);
			if (index !== undefined && model.resolved[index].visible) {
				return index;
			}
		}
		return null;
	}

	/** Records the point the renderer's hit test just found, for the crosshair event that follows. */
	public recordHit(model: ScatterModel, index: number | null): void {
		this.#lastHit = index === null ? null : { model: model as ScatterModel<TPoint>, index };
	}

	/** Sets the point hovered through the API. Whether that changed it. */
	public setApiHovered(objectId: string | null): boolean {
		if (objectId === this.#apiId) {
			return false;
		}
		this.#apiId = objectId;
		return true;
	}

	/** Notifies the hovered point after the chart's next paint. */
	public scheduleNotification(): void {
		this.#notification.schedule();
	}

	/** Notifies the hovered point now, should it have changed since the last notification. */
	public notify(): void {
		// The usual case on every frame: nothing hovered, nothing to tell.
		if (this.#notified === null && this.index() === null) {
			return;
		}
		const info = this.#host.hoveredPoint();
		if (samePointInfo(info, this.#notified)) {
			return;
		}
		this.#notified = info;
		this.#changed.fire(info);
	}

	public subscribe(handler: (point: ScatterPointInfo<TPoint> | null) => void): void {
		this.#changed.subscribe(handler);
	}

	public unsubscribe(handler: (point: ScatterPointInfo<TPoint> | null) => void): void {
		this.#changed.unsubscribe(handler);
	}

	/** Gives `null` to the subscribers last given a point, as when the pointer leaves it, and drops them all. */
	public dispose(): void {
		const hovered = this.#notified;
		this.#notified = null;
		try {
			if (hovered !== null) {
				this.#changed.fire(null);
			}
		} finally {
			this.#changed.destroy();
		}
	}

	public readonly onCrosshairMove = (param: MouseEventParams<number>): void => {
		const info = param.hoveredInfo;
		const id = info !== undefined && info.series === this.#host.series() && typeof info.objectId === 'string'
			? info.objectId
			: null;
		let next: PointerHover | null = null;
		if (id !== null) {
			// The index the hit test found tells apart points sharing the id.
			const model = this.#host.model();
			const hit = this.#lastHit;
			const index = hit !== null && hit.model === model && model.resolved[hit.index]?.id === id
				? hit.index
				: model.idToIndex.get(id);
			next = index !== undefined ? { id, index } : null;
		}
		const current = this.#pointer;
		if (next?.id !== current?.id || next?.index !== current?.index) {
			this.#pointer = next;
			this.scheduleNotification();
		}
	};
}
