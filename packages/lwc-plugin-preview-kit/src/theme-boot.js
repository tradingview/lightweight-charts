/*
 * Sets the preview page's theme before its first paint.
 *
 * `pnpm plugins:build-demos` inlines this file, without this comment, straight
 * after `<meta charset>` of every built preview page. The page's own script is
 * a module, which can run after the browser has already painted the page
 * once; on a dark docs page that would be a flash of the light background.
 * `preview-theme.ts` starts from the theme set here and keeps following the
 * docs page from there.
 *
 * Plain script, no imports: it runs before anything else has loaded.
 */
(function () {
	var root = document.documentElement;
	var theme = new URLSearchParams(window.location.search).get('theme');
	if (theme !== 'light' && theme !== 'dark') {
		try {
			theme = window.parent === window
				? null
				: window.parent.document.documentElement.getAttribute('data-theme');
		} catch (error) {
			// Cross-origin parent: its document is not readable.
			theme = null;
		}
	}
	root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
})();
