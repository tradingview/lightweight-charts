import { expect } from 'chai';
import { describe, it } from 'node:test';

import { defaultMessages, formatUpdateMessage, mergeMessages } from '../../src/messages';

void describe('defaultMessages', () => {
	void it('is frozen, including the nested string groups', () => {
		expect(Object.isFrozen(defaultMessages)).to.equal(true);
		expect(Object.isFrozen(defaultMessages.ohlc)).to.equal(true);
		expect(Object.isFrozen(defaultMessages.directions)).to.equal(true);
	});

	void it('names the pane when several panes share a title', () => {
		const args = { title: 'Prices', seriesCount: 1, seriesLabel: null, paneCount: 2 };
		expect(defaultMessages.paneLabel({ ...args, paneIndex: 1 })).to.contain('Pane 2 of 2');
		expect(defaultMessages.paneLabel({ ...args, paneIndex: 0, paneCount: 1 })).to.not.contain('Pane');
	});
});

void describe('mergeMessages', () => {
	void it('returns the base bundle untouched without an override', () => {
		expect(mergeMessages(defaultMessages)).to.equal(defaultMessages);
	});

	void it('replaces top-level entries', () => {
		const merged = mergeMessages(defaultMessages, { noValue: 'sin valor' });
		expect(merged.noValue).to.equal('sin valor');
		expect(merged.inView).to.equal(defaultMessages.inView);
	});

	void it('shallow-merges the string groups', () => {
		const merged = mergeMessages(defaultMessages, { ohlc: { close: 'cierre' } });
		expect(merged.ohlc).to.deep.equal({ open: 'open', high: 'high', low: 'low', close: 'cierre' });
		expect(merged.directions).to.deep.equal(defaultMessages.directions);
	});

	void it('does not let an explicit undefined erase a default', () => {
		const merged = mergeMessages(defaultMessages, { noValue: undefined });
		expect(merged.noValue).to.equal(defaultMessages.noValue);
	});

	void it('leaves the frozen base bundle alone', () => {
		mergeMessages(defaultMessages, { ohlc: { close: 'cierre' } });
		expect(defaultMessages.ohlc.close).to.equal('close');
	});
});

void describe('formatUpdateMessage', () => {
	void it('is empty when nothing changed', () => {
		expect(formatUpdateMessage([], defaultMessages, 3)).to.equal('');
	});

	void it('reads a single series summary as one sentence', () => {
		expect(formatUpdateMessage(['Price, 5 data points'], defaultMessages, 3))
			.to.equal('Chart data updated. Price, 5 data points.');
	});

	void it('lists at most maxSeries summaries and counts the rest', () => {
		const message = formatUpdateMessage(['a', 'b', 'c', 'd'], defaultMessages, 2);
		expect(message).to.equal('Chart data updated. 4 series changed. a b. 2 more series changed.');
	});
});
