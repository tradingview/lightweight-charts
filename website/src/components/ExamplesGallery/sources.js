// The code of every example, keyed by its path under `examples/`
// (`./series-types/line.js`). Lazy: a card fetches its own file when it scrolls
// into view. Only files one folder deep are examples; that leaves out the
// folder's own `.eslintrc.js`.
const context = require.context('!!raw-loader!@site/examples', true, /^\.\/[^/]+\/[^/.]+\.js$/, 'lazy');

/**
 * @param {string} docId The example page's doc id, e.g. `series-types/line`.
 * @returns {Promise<string> | null} Its code, or null when the page has no
 * code file of the same name next to it.
 */
export function loadExampleSource(docId) {
	const key = `./${docId}.js`;
	if (!context.keys().includes(key)) {
		return null;
	}
	return context(key).then(module => module.default);
}
