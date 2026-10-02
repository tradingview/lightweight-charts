import { expect } from 'chai';
import { afterEach, describe, it } from 'node:test';

import {
	HIGH_CONTRAST_QUERIES,
	REDUCED_MOTION_QUERY,
	mediaQueryMatches,
	subscribeMediaQuery,
} from '../../src/dom/media-query.js';

/** Minimal stand-in for a `MediaQueryList`, with a way to flip its state. */
class FakeMediaQueryList {
	public readonly media: string;
	public matches = false;
	public listeners: (() => void)[] = [];

	public constructor(media: string) {
		this.media = media;
	}

	public addEventListener(type: string, listener: () => void): void {
		if (type === 'change') {
			this.listeners.push(listener);
		}
	}

	public removeEventListener(type: string, listener: () => void): void {
		if (type === 'change') {
			this.listeners = this.listeners.filter((item: () => void) => item !== listener);
		}
	}

	/** Flips the state and notifies, the way the browser does. */
	public set(matches: boolean): void {
		this.matches = matches;
		for (const listener of [...this.listeners]) {
			listener();
		}
	}
}

const globals = globalThis as unknown as {
	window?: { matchMedia?: (query: string) => unknown };
};

let created: Map<string, FakeMediaQueryList> = new Map();
let matchMediaCalls = 0;

/** Installs a fake `window.matchMedia`, as a browser-less environment has none. */
function installMatchMedia(): Map<string, FakeMediaQueryList> {
	created = new Map();
	matchMediaCalls = 0;
	globals.window = {
		matchMedia: (query: string): unknown => {
			matchMediaCalls++;
			let list = created.get(query);
			if (list === undefined) {
				list = new FakeMediaQueryList(query);
				created.set(query, list);
			}
			return list;
		},
	};
	return created;
}

function list(query: string): FakeMediaQueryList {
	const found = created.get(query);
	if (found === undefined) {
		throw new Error(`matchMedia was never called with ${query}`);
	}
	return found;
}

// The module caches one MediaQueryList per query text for the lifetime of the
// process, so every test uses query strings of its own.
let uniqueId = 0;
function uniqueQueries(count: number): string[] {
	const id = ++uniqueId;
	return Array.from({ length: count }, (_: unknown, index: number) => `(test-${id}-${index}: on)`);
}

afterEach(() => {
	delete globals.window;
});

void describe('subscribeMediaQuery', () => {
	void it('reports a flip to matching, with the new value', () => {
		installMatchMedia();
		const [query] = uniqueQueries(1);
		const seen: boolean[] = [];
		subscribeMediaQuery([query], (matches: boolean) => seen.push(matches));
		expect(seen).to.deep.equal([], 'the initial state is not reported');
		list(query).set(true);
		expect(seen).to.deep.equal([true]);
	});

	void it('reports each flip once, and ignores changes which do not flip the result', () => {
		installMatchMedia();
		const queries = uniqueQueries(2);
		const seen: boolean[] = [];
		subscribeMediaQuery(queries, (matches: boolean) => seen.push(matches));
		list(queries[0]).set(true);
		// A second query starting to match while the first still does: no flip.
		list(queries[1]).set(true);
		expect(seen).to.deep.equal([true]);
		// Only the last one going quiet flips the combined result back.
		list(queries[0]).set(false);
		expect(seen).to.deep.equal([true]);
		list(queries[1]).set(false);
		expect(seen).to.deep.equal([true, false]);
	});

	void it('starts from the current state, so an already-matching query does not fire', () => {
		installMatchMedia();
		const [query] = uniqueQueries(1);
		// Materialise the list and set it before subscribing.
		expect(mediaQueryMatches([query])).to.equal(false);
		list(query).set(true);
		let calls = 0;
		subscribeMediaQuery([query], () => calls++);
		list(query).set(true);
		expect(calls).to.equal(0);
		list(query).set(false);
		expect(calls).to.equal(1);
	});

	void it('shares one MediaQueryList between subscribers of the same query', () => {
		installMatchMedia();
		const [query] = uniqueQueries(1);
		const seen: string[] = [];
		subscribeMediaQuery([query], (matches: boolean) => seen.push(`a${String(matches)}`));
		subscribeMediaQuery([query], (matches: boolean) => seen.push(`b${String(matches)}`));
		expect(matchMediaCalls).to.equal(1);
		expect(list(query).listeners.length).to.equal(2);
		list(query).set(true);
		expect(seen).to.deep.equal(['atrue', 'btrue']);
	});

	void it('stops listening on unsubscribe, and leaves other subscribers alone', () => {
		installMatchMedia();
		const [query] = uniqueQueries(1);
		const seen: string[] = [];
		const unsubscribe = subscribeMediaQuery([query], () => seen.push('a'));
		subscribeMediaQuery([query], () => seen.push('b'));
		unsubscribe();
		expect(list(query).listeners.length).to.equal(1);
		list(query).set(true);
		expect(seen).to.deep.equal(['b']);
	});

	void it('tolerates unsubscribing twice', () => {
		installMatchMedia();
		const [query] = uniqueQueries(1);
		const unsubscribe = subscribeMediaQuery([query], () => {});
		unsubscribe();
		expect(() => unsubscribe()).to.not.throw();
		expect(list(query).listeners.length).to.equal(0);
	});

	void it('is a no-op without matchMedia, so it is safe on the server', () => {
		delete globals.window;
		const [query] = uniqueQueries(1);
		let calls = 0;
		const unsubscribe = subscribeMediaQuery([query], () => calls++);
		expect(() => unsubscribe()).to.not.throw();
		expect(calls).to.equal(0);
	});
});

void describe('mediaQueryMatches', () => {
	void it('is true when any of the queries matches', () => {
		installMatchMedia();
		const queries = uniqueQueries(2);
		expect(mediaQueryMatches(queries)).to.equal(false);
		list(queries[1]).set(true);
		expect(mediaQueryMatches(queries)).to.equal(true);
	});

	void it('is false without matchMedia', () => {
		delete globals.window;
		expect(mediaQueryMatches(uniqueQueries(1))).to.equal(false);
	});

	void it('is false for an empty list of queries', () => {
		installMatchMedia();
		expect(mediaQueryMatches([])).to.equal(false);
	});
});

void describe('query constants', () => {
	void it('cover the OS high-contrast signals', () => {
		expect([...HIGH_CONTRAST_QUERIES]).to.deep.equal([
			'(prefers-contrast: more)',
			'(forced-colors: active)',
		]);
	});

	void it('names the reduced-motion query', () => {
		expect(REDUCED_MOTION_QUERY).to.equal('(prefers-reduced-motion: reduce)');
	});
});
