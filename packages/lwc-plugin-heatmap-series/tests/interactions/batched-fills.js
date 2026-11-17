// Cells are filled together by color: a paint of 160 cells in four colors,
// with borders, fills one path per color and one for the borders, not one per
// cell.
async function beforeInteractions(container) {
	const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
	const chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false, background: { color: '#ffffff' } },
		grid: { vertLines: { visible: false }, horzLines: { visible: false } },
		crosshair: { mode: LightweightCharts.CrosshairMode.Hidden },
		timeScale: { barSpacing: 20 },
	});
	const series = LwcPlugin.createHeatmapSeries(chart, {
		cellShader: LwcPlugin.createColorScale({ stops: ['#0000ff', '#ff0000'], steps: 4 }),
		cellBorderWidth: 1,
		cellBorderColor: '#131722',
	});
	const times = Array.from({ length: 16 }, (_, i) => 1704067200 + i * 86400);
	series.setData(times.map((time, i) => ({ time, cells: Array.from({ length: 10 }, (_, r) => ({ low: r * 10, high: r * 10 + 10, amount: (i * 7 + r * 13) % 100 })) })));
	chart.timeScale().fitContent();
	await frames();
	const context = chart.panes()[0].getHTMLElement().querySelector('td[style*="relative"] canvas').getContext('2d');
	let fills = 0;
	const fill = context.fill;
	context.fill = function (...args) {
		fills++;
		return fill.apply(this, args);
	};
	series.applyOptions({ cellBorderColor: '#FFFFFF' });
	await frames();
	context.fill = fill;
	if (fills < 2 || fills > 5) {
		throw new Error(`Expected one fill per color and one for the borders, at most 5, got ${fills}`);
	}
}
