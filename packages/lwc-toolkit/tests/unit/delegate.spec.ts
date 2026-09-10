import { expect } from 'chai';
import { describe, it } from 'node:test';

import { Delegate } from '../../src/delegate.js';

void describe('Delegate', () => {
	void it('starts with no listeners', () => {
		expect(new Delegate().hasListeners()).to.equal(false);
	});

	void it('fires every subscriber in subscription order, with the parameter', () => {
		const delegate = new Delegate<number>();
		const calls: string[] = [];
		delegate.subscribe((value: number) => calls.push(`a${value}`));
		delegate.subscribe((value: number) => calls.push(`b${value}`));
		delegate.fire(7);
		expect(calls).to.deep.equal(['a7', 'b7']);
	});

	void it('fires the same callback once per subscription', () => {
		const delegate = new Delegate();
		let count = 0;
		const callback = () => {
			count++;
		};
		delegate.subscribe(callback);
		delegate.subscribe(callback);
		delegate.fire();
		expect(count).to.equal(2);
	});

	void it('unsubscribe removes only the first matching subscription', () => {
		const delegate = new Delegate();
		let count = 0;
		const callback = () => {
			count++;
		};
		delegate.subscribe(callback);
		delegate.subscribe(callback);
		delegate.unsubscribe(callback);
		delegate.fire();
		expect(count).to.equal(1);
		expect(delegate.hasListeners()).to.equal(true);
	});

	void it('unsubscribe is a no-op for an unknown callback', () => {
		const delegate = new Delegate();
		let count = 0;
		delegate.subscribe(() => {
			count++;
		});
		delegate.unsubscribe(() => {
			/* never subscribed */
		});
		delegate.fire();
		expect(count).to.equal(1);
	});

	void it('unsubscribeAll removes every listener sharing a linked object', () => {
		const delegate = new Delegate();
		const owner = {};
		const other = {};
		const calls: string[] = [];
		delegate.subscribe(() => calls.push('owned1'), owner);
		delegate.subscribe(() => calls.push('owned2'), owner);
		delegate.subscribe(() => calls.push('other'), other);
		delegate.unsubscribeAll(owner);
		delegate.fire();
		expect(calls).to.deep.equal(['other']);
	});

	void it('unsubscribeAll compares linked objects by identity, not value', () => {
		const delegate = new Delegate();
		const calls: string[] = [];
		delegate.subscribe(() => calls.push('a'), { id: 1 });
		delegate.unsubscribeAll({ id: 1 });
		delegate.fire();
		expect(calls).to.deep.equal(['a']);
	});

	void it('unsubscribeAll(undefined) removes listeners subscribed without a linked object', () => {
		const delegate = new Delegate();
		const calls: string[] = [];
		delegate.subscribe(() => calls.push('anonymous'));
		delegate.subscribe(() => calls.push('owned'), {});
		delegate.unsubscribeAll(undefined);
		delegate.fire();
		expect(calls).to.deep.equal(['owned']);
	});

	void it('a singleshot listener runs once and is then dropped', () => {
		const delegate = new Delegate();
		let count = 0;
		delegate.subscribe(
			() => {
				count++;
			},
			undefined,
			true
		);
		delegate.fire();
		delegate.fire();
		expect(count).to.equal(1);
		expect(delegate.hasListeners()).to.equal(false);
	});

	void it('singleshot only when passed exactly true', () => {
		const delegate = new Delegate();
		let count = 0;
		delegate.subscribe(
			() => {
				count++;
			},
			undefined,
			false
		);
		delegate.fire();
		delegate.fire();
		expect(count).to.equal(2);
	});

	void it('removes singleshot listeners before invoking them, so a re-entrant fire skips them', () => {
		const delegate = new Delegate();
		const calls: string[] = [];
		let fired = false;
		delegate.subscribe(
			() => {
				calls.push('once');
			},
			undefined,
			true
		);
		delegate.subscribe(() => {
			calls.push('always');
			if (!fired) {
				fired = true;
				delegate.fire();
			}
		});
		delegate.fire();
		// the singleshot listener is gone from _listeners by the time the nested
		// fire happens, so it is not invoked again
		expect(calls).to.deep.equal(['once', 'always', 'always']);
	});

	void it('fires against a snapshot, so a listener unsubscribing during fire is still called', () => {
		const delegate = new Delegate();
		const calls: string[] = [];
		const second = () => calls.push('second');
		delegate.subscribe(() => {
			calls.push('first');
			delegate.unsubscribe(second);
		});
		delegate.subscribe(second);
		delegate.fire();
		expect(calls).to.deep.equal(['first', 'second']);
		// but it is gone for the next fire
		delegate.fire();
		expect(calls).to.deep.equal(['first', 'second', 'first']);
	});

	void it('a listener subscribed during fire is not called by that fire', () => {
		const delegate = new Delegate();
		const calls: string[] = [];
		delegate.subscribe(() => {
			calls.push('first');
			delegate.subscribe(() => calls.push('late'));
		});
		delegate.fire();
		expect(calls).to.deep.equal(['first']);
	});

	void it('destroy removes every listener', () => {
		const delegate = new Delegate();
		let count = 0;
		delegate.subscribe(() => {
			count++;
		});
		delegate.subscribe(
			() => {
				count++;
			},
			{},
			true
		);
		delegate.destroy();
		expect(delegate.hasListeners()).to.equal(false);
		delegate.fire();
		expect(count).to.equal(0);
	});

	void it('can be reused after destroy', () => {
		const delegate = new Delegate();
		delegate.destroy();
		let count = 0;
		delegate.subscribe(() => {
			count++;
		});
		delegate.fire();
		expect(count).to.equal(1);
	});

	void it('fire on an empty delegate does nothing', () => {
		expect(() => new Delegate<string>().fire('x')).to.not.throw();
	});
});
