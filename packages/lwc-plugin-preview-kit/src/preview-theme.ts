/**
 * Light and dark theme of a catalogue preview page.
 *
 * The page follows the docs site that frames it: it reads the site's
 * `data-theme` and keeps watching it, so toggling the site theme restyles the
 * running preview in place — no reload, no new random data, no lost control
 * state. The frame and the site share an origin, so this needs nothing from
 * the site itself.
 *
 * `?theme=light` or `?theme=dark` in the page URL pins the theme instead, for
 * a page opened on its own or framed from another origin. Anything else falls
 * back to light.
 *
 * The page's root element carries the theme as `data-theme`, which is what
 * `preview.css` keys its colours on. On a built page `theme-boot.js` sets it
 * before the first paint, and this module starts from that value.
 */

export type PreviewTheme = 'light' | 'dark';

type ThemeListener = (theme: PreviewTheme) => void;

/** The subset of the chart API this module needs; keeps the kit free of a `lightweight-charts` dependency. */
interface ThemableChart {
	applyOptions(options: object): void;
}

const palette = {
	light: {
		background: '#FFFFFF',
		text: '#191919',
		grid: '#D6DCDE',
		border: '#2B2B43',
		separator: '#E0E3EB',
		crosshairLabel: '#131722',
	},
	// TradingView cold grays, the ones the docs site's dark theme is built from:
	// the chart sits on the site's own black, the lines step up from there.
	dark: {
		background: '#000000',
		text: '#DBDBDB',
		grid: '#1F1F1F',
		border: '#2E2E2E',
		separator: '#2E2E2E',
		crosshairLabel: '#4A4A4A',
	},
} as const;

/**
 * The chart options that differ between the two themes. Light restates the
 * library defaults, so switching back from dark leaves no dark colour behind.
 */
export function chartThemeOptions(theme: PreviewTheme): object {
	const colors = palette[theme];
	const scale = { borderColor: colors.border };
	const crosshairLine = { labelBackgroundColor: colors.crosshairLabel };
	return {
		layout: {
			background: { type: 'solid', color: colors.background },
			textColor: colors.text,
			panes: { separatorColor: colors.separator },
		},
		grid: {
			vertLines: { color: colors.grid },
			horzLines: { color: colors.grid },
		},
		rightPriceScale: scale,
		leftPriceScale: scale,
		timeScale: scale,
		crosshair: { vertLine: crosshairLine, horzLine: crosshairLine },
	};
}

function asTheme(value: string | null | undefined): PreviewTheme | null {
	return value === 'light' || value === 'dark' ? value : null;
}

/**
 * The framing page's root element, when the page is framed by a same-origin
 * page. It is watched even when it carries no theme yet, so a page that sets
 * one later is still followed.
 */
function framingRoot(): HTMLElement | null {
	try {
		return window.parent === window ? null : window.parent.document.documentElement;
	} catch {
		// Cross-origin parent: its document is not readable.
		return null;
	}
}

const listeners = new Set<ThemeListener>();
const pinned = asTheme(new URLSearchParams(window.location.search).get('theme'));
const framing = pinned === null ? framingRoot() : null;
// Set by theme-boot.js; the rest is for an unbuilt dev page, which has none.
let current: PreviewTheme = asTheme(document.documentElement.getAttribute('data-theme'))
	?? pinned
	?? asTheme(framing?.getAttribute('data-theme'))
	?? 'light';

function setTheme(theme: PreviewTheme): void {
	document.documentElement.setAttribute('data-theme', theme);
	if (theme === current) {
		return;
	}
	current = theme;
	listeners.forEach((listener: ThemeListener) => {
		try {
			listener(theme);
		} catch (error) {
			// Reported, but the other listeners still run.
			queueMicrotask(() => {
				throw error;
			});
		}
	});
}

document.documentElement.setAttribute('data-theme', current);
if (framing !== null) {
	const observer = new MutationObserver(() => {
		const theme = asTheme(framing.getAttribute('data-theme'));
		if (theme !== null) {
			setTheme(theme);
		}
	});
	observer.observe(framing, { attributes: true, attributeFilter: ['data-theme'] });
	// The framing page outlives this frame and would keep it in memory.
	window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
}

/** The theme the page is drawn in right now. */
export function previewTheme(): PreviewTheme {
	return current;
}

/**
 * Calls `listener` on every later theme change, never on subscribe. Returns
 * the function that unsubscribes it.
 */
export function onPreviewThemeChange(listener: ThemeListener): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

/**
 * Themes `chart` now and on every later change. Call it in the same script
 * run as `createChart` — the chart draws on the next animation frame, so
 * anything set up synchronously before this call is fine — and the chart never
 * shows up in the wrong colours.
 *
 * `onTheme`, when given, runs right after the chart options on both occasions:
 * it is where a preview recolours whatever only it knows about — a series
 * colour that would vanish on the dark background, a grid colour of its own.
 */
export function themeChart(chart: ThemableChart, onTheme?: ThemeListener): void {
	const apply = (theme: PreviewTheme): void => {
		chart.applyOptions(chartThemeOptions(theme));
		onTheme?.(theme);
	};
	apply(current);
	onPreviewThemeChange(apply);
}
