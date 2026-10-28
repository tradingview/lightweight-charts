import { expect } from 'chai';
import { describe, it } from 'node:test';

import { createCoalescedTask } from '../../src/scheduling/coalesced-task.js';

/** Resolves once the microtasks queued so far have run. */
function microtasks(): Promise<void> {
	return new Promise<void>((resolve: () => void) => setTimeout(resolve, 0));
}

void describe('createCoalescedTask', () => {
	void it('runs once on the next microtask, however often it is scheduled', async () => {
		let runs = 0;
		const task = createCoalescedTask(() => runs++);
		task.schedule();
		task.schedule();
		task.schedule();
		expect(task.pending()).to.equal(true);
		expect(runs).to.equal(0);
		await microtasks();
		expect(runs).to.equal(1);
		expect(task.pending()).to.equal(false);
		task.schedule();
		await microtasks();
		expect(runs).to.equal(2);
	});

	void it('runs nothing once cancelled', async () => {
		let runs = 0;
		const task = createCoalescedTask(() => runs++);
		task.schedule();
		task.cancel();
		expect(task.pending()).to.equal(false);
		await microtasks();
		expect(runs).to.equal(0);
	});

	void it('runs once when scheduled again after a cancel in the same turn', async () => {
		let runs = 0;
		const task = createCoalescedTask(() => runs++);
		task.schedule();
		task.cancel();
		task.schedule();
		await microtasks();
		expect(runs).to.equal(1);
	});

	void it('can be scheduled again from the work itself', async () => {
		let runs = 0;
		const task = createCoalescedTask(() => {
			runs++;
			if (runs < 3) {
				task.schedule();
			}
		});
		task.schedule();
		await microtasks();
		expect(runs).to.equal(3);
	});

	void it('can be scheduled again after the work threw', async () => {
		let runs = 0;
		const queued: (() => void)[] = [];
		const task = createCoalescedTask(() => {
			runs++;
			throw new Error('failed');
		}, (callback: () => void) => queued.push(callback));
		task.schedule();
		expect(() => queued[0]()).to.throw('failed');
		task.schedule();
		expect(queued).to.have.length(2);
		expect(() => queued[1]()).to.throw('failed');
		expect(runs).to.equal(2);
	});

	void it('is not left pending when queueing throws, and queues again on the next schedule', () => {
		let runs = 0;
		let available = false;
		const queued: (() => void)[] = [];
		const task = createCoalescedTask(() => runs++, (callback: () => void) => {
			if (!available) {
				throw new ReferenceError('requestAnimationFrame is not defined');
			}
			queued.push(callback);
		});
		expect(() => task.schedule()).to.throw(ReferenceError);
		expect(task.pending()).to.equal(false);
		available = true;
		task.schedule();
		expect(task.pending()).to.equal(true);
		expect(queued).to.have.length(1);
		queued[0]();
		expect(runs).to.equal(1);
	});

	void it('runs a callback queued synchronously', () => {
		let runs = 0;
		const task = createCoalescedTask(() => runs++, (callback: () => void) => callback());
		task.schedule();
		expect(runs).to.equal(1);
		expect(task.pending()).to.equal(false);
	});

	void it('queues with the function given, once per request', () => {
		let runs = 0;
		const queued: (() => void)[] = [];
		const task = createCoalescedTask(() => runs++, (callback: () => void) => queued.push(callback));
		task.schedule();
		task.schedule();
		expect(queued).to.have.length(1);
		queued[0]();
		queued[0]();
		expect(runs).to.equal(1);
	});
});
