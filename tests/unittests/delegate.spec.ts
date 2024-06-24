/* eslint-disable @typescript-eslint/no-floating-promises */
import { expect } from 'chai';
import { describe, it } from 'node:test';

import { Delegate } from '../../src/helpers/delegate';

describe('Delegate', () => {
	it('unsubscribeAll', () => {
		const linkedObjectOne = {};
		const linkedObjectTwo = {};
		const eventDelegate: Delegate = new Delegate();
		eventDelegate.subscribe(() => {}, linkedObjectOne);

		expect(eventDelegate.hasListeners()).to.be.equal(true);

		eventDelegate.unsubscribeAll(linkedObjectTwo);
		expect(eventDelegate.hasListeners()).to.be.equal(true);

		eventDelegate.unsubscribeAll(linkedObjectOne);
		expect(eventDelegate.hasListeners()).to.be.equal(false);
	});
});
