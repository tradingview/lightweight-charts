// A preview draws an example as an illustration for its gallery card: no
// scales, labels, crosshair, or logo, and few enough bars that each one reads.
// The example's own code runs unchanged; the chart it creates is restyled.

// A card is about 250px wide. The plugin catalog's illustrations show 7–10
// bars at that size; a few more still reads as a chart and keeps a trend.
const MAX_PREVIEW_BARS = 30;

interface PreviewSeries {
	applyOptions(options: Record<string, unknown>): void;
}

interface PreviewChart {
	applyOptions(options: Record<string, unknown>): void;
	addSeries(...args: unknown[]): PreviewSeries;
	timeScale(): {
		getVisibleLogicalRange(): { from: number; to: number } | null;
		setVisibleLogicalRange(range: { from: number; to: number }): void;
	};
}

type CreateChart = (...args: unknown[]) => PreviewChart;

const PREVIEW_SERIES_OPTIONS = {
	lastValueVisible: false,
	priceLineVisible: false,
	crosshairMarkerVisible: false,
};

// Buttons, and the bars that hold them, are the example's controls rather
// than its picture: a card has no room for them and they cannot be pressed.
export const PREVIEW_PAGE_CSS = 'button, :not(#container):has(> button) { display: none !important; }';

/**
 * The site theme's colors for a preview: its chart options and the color of
 * the text the example puts around its chart, such as a legend.
 */
export interface PreviewLook {
	chartOptions: Record<string, unknown>;
	textColor: string;
}

/** Recolors the text around a preview's chart; it overrides inline colors. */
export function previewTextCss(textColor: string): string {
	return `#container, #container * { color: ${textColor} !important; }`;
}

/**
 * `showScales` keeps the price and time scales, for an example that is about
 * their labels (a locale, a font) and would otherwise look like any other.
 */
export function previewChartOptions(gridColor: string, showScales: boolean = false): Record<string, unknown> {
	return {
		layout: {
			attributionLogo: false,
			background: { type: 'solid', color: 'transparent' },
		},
		// The labels at the edges are dropped when cut off by the card.
		rightPriceScale: { visible: showScales, entireTextOnly: true, scaleMargins: { top: 0.15, bottom: 0.15 } },
		leftPriceScale: { visible: false },
		timeScale: { visible: showScales },
		grid: {
			vertLines: { visible: false },
			horzLines: { color: gridColor },
		},
		crosshair: {
			mode: 2, // CrosshairMode.Hidden
			vertLine: { visible: false, labelVisible: false },
			horzLine: { visible: false, labelVisible: false },
		},
		handleScroll: false,
		handleScale: false,
	};
}

export interface PreviewSession {
	/**
	 * Wraps a chart factory (`createChart`, `createChartEx`, …) so every chart
	 * it creates is restyled as a preview. `narrowRange` limits a chart to its
	 * most recent bars; it suits time-based charts, not a yield curve or a
	 * price-based horizontal scale, which are shown whole.
	 */
	wrap<T>(create: T, narrowRange: boolean): T;
	/**
	 * To call once the example has run: narrows the ranges and then calls
	 * `onSettled`. Until then a chart shows its whole range, so the preview is
	 * kept hidden to not show it jump.
	 */
	afterRun(onSettled: () => void): void;
	/**
	 * Redraws every chart in the session in another look. A theme switch
	 * rebuilds the preview, which takes a moment; until then the preview on
	 * screen is restyled in place, so it does not lag behind the page.
	 */
	restyle(look: PreviewLook): void;
}

export function createPreviewSession(chartOptions: Record<string, unknown>): PreviewSession {
	const charts: PreviewChart[] = [];
	const narrowed: PreviewChart[] = [];
	// A preview that shows the time scale is about its labels, which need the
	// whole range to show months and years.
	const keepsRange = (chartOptions.timeScale as { visible?: boolean } | undefined)?.visible === true;

	const wrap = <T>(create: T, narrowRange: boolean): T => ((...args: unknown[]) => {
		const chart = (create as unknown as CreateChart)(...args);
		chart.applyOptions(chartOptions);
		charts.push(chart);
		const addSeries = chart.addSeries.bind(chart);
		chart.addSeries = (...seriesArgs: unknown[]) => {
			const series = addSeries(...seriesArgs);
			series.applyOptions(PREVIEW_SERIES_OPTIONS);
			return series;
		};
		if (narrowRange && !keepsRange) {
			narrowed.push(chart);
		}
		return chart;
	}) as unknown as T;

	const afterRun = (onSettled: () => void) => {
		// `fitContent` settles on the next frame; read the range after it.
		window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
			for (const chart of narrowed) {
				const range = chart.timeScale().getVisibleLogicalRange();
				if (range !== null && range.to - range.from > MAX_PREVIEW_BARS) {
					chart.timeScale().setVisibleLogicalRange({ from: range.to - MAX_PREVIEW_BARS, to: range.to });
				}
			}
			// The new range is drawn on the next frame.
			window.requestAnimationFrame(onSettled);
		}));
	};

	// Only the colors: the rest of the options may have been changed by the
	// example since the chart was created.
	const restyle = (look: PreviewLook) => {
		for (const chart of charts) {
			chart.applyOptions({ layout: { textColor: look.textColor }, grid: look.chartOptions.grid });
		}
	};

	return { wrap, afterRun, restyle };
}
