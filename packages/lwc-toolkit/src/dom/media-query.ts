/**
 * The OS queries which mean "draw with more contrast": either the user asked
 * for increased contrast, or a forced-colors mode (e.g. Windows High Contrast)
 * is active.
 */
export const HIGH_CONTRAST_QUERIES: readonly string[] = [
	'(prefers-contrast: more)',
	'(forced-colors: active)',
];

/** The OS query which means "avoid animation". */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * One `MediaQueryList` per query text, shared by every subscriber: creating a
 * fresh list per subscriber would attach a listener per subscriber to a new
 * object each time. Populated lazily, so importing this module touches no DOM
 * API and is safe on the server.
 */
const mediaQueryLists = new Map<string, MediaQueryList>();

function mediaQueryList(query: string): MediaQueryList | null {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
		return null;
	}
	let list = mediaQueryLists.get(query);
	if (list === undefined) {
		list = window.matchMedia(query);
		mediaQueryLists.set(query, list);
	}
	return list;
}

/**
 * Whether any of the given media queries currently matches. Returns `false`
 * where `matchMedia` is unavailable (server-side rendering), so a caller can
 * treat it as "the OS asks for nothing special".
 */
export function mediaQueryMatches(queries: readonly string[]): boolean {
	return queries.some((query: string) => mediaQueryList(query)?.matches ?? false);
}

/**
 * Watches a set of media queries and calls `onChange` whenever their combined
 * result – does *any* of them match – flips, passing the new value. The initial
 * state is not reported: read it with {@link mediaQueryMatches} if it is needed.
 *
 * Returns an unsubscribe function; calling it more than once is harmless. Where
 * `matchMedia` is unavailable (server-side rendering) nothing is watched and the
 * returned function is a no-op.
 */
export function subscribeMediaQuery(
	queries: readonly string[],
	onChange: (matches: boolean) => void
): () => void {
	const lists: MediaQueryList[] = [];
	for (const query of queries) {
		const list = mediaQueryList(query);
		if (list !== null) {
			lists.push(list);
		}
	}
	if (lists.length === 0) {
		return (): void => {};
	}

	let matches = lists.some((list: MediaQueryList) => list.matches);
	const handler = (): void => {
		const next = lists.some((list: MediaQueryList) => list.matches);
		if (next === matches) {
			return;
		}
		matches = next;
		onChange(next);
	};
	for (const list of lists) {
		list.addEventListener('change', handler);
	}

	let subscribed = true;
	return (): void => {
		if (!subscribed) {
			return;
		}
		subscribed = false;
		for (const list of lists) {
			list.removeEventListener('change', handler);
		}
	};
}
