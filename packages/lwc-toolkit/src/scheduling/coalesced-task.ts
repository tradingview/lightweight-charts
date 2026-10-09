/** A piece of work run at most once per turn, however often it is asked for. */
export interface CoalescedTask {
	/**
	 * Queues the work, unless it is queued already. Called from the work
	 * itself, it queues it once more.
	 */
	schedule(): void;
	/**
	 * Drops the queued work, if any; a later {@link schedule} queues it again.
	 * Call it when the owner is disposed, so that nothing runs after removal.
	 */
	cancel(): void;
	/** Whether the work is queued and not cancelled. */
	pending(): boolean;
}

/**
 * Coalesces requests for `run` into one call on the next microtask, or on
 * whatever turn `enqueue` waits for (pass
 * `(callback) => requestAnimationFrame(callback)` to run once per frame).
 *
 * Useful for work a plugin must not do from inside the chart's own event
 * dispatch, or wants to do once for a burst of events: laying out again after
 * several option changes, reacting to a size change once the paint is over,
 * letting go of a chart found removed.
 *
 * The task is marked as not queued before `run` is called, so `run` may
 * schedule it again; should `run` throw, the task can still be scheduled.
 * Should `enqueue` throw (no `requestAnimationFrame` outside a browser, say),
 * `schedule()` throws with it and the task is left not pending.
 *
 * @param run - the work.
 * @param enqueue - queues a callback; `queueMicrotask` by default.
 */
export function createCoalescedTask(
	run: () => void,
	enqueue: (callback: () => void) => void = (callback: () => void) => queueMicrotask(callback)
): CoalescedTask {
	// The request a queued callback answers: a callback whose request was
	// cancelled, or replaced after a cancel, does nothing.
	let request: object | null = null;
	return {
		schedule(): void {
			if (request !== null) {
				return;
			}
			const current = {};
			// Pending before `enqueue`, which may run the callback at once.
			request = current;
			try {
				enqueue(() => {
					if (request !== current) {
						return;
					}
					request = null;
					run();
				});
			} catch (error) {
				// Nothing was queued: not pending, so the next `schedule()` tries again.
				if (request === current) {
					request = null;
				}
				throw error;
			}
		},
		cancel(): void {
			request = null;
		},
		pending(): boolean {
			return request !== null;
		},
	};
}
