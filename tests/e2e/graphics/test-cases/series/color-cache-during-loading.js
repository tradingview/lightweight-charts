// Model the transient computed-style result reported in #1985 deterministically.
// The original Chrome/Vite startup race is not reproducible on every browser.
function runTestCase(container) {
	const originalReadyState = Object.getOwnPropertyDescriptor(document, 'readyState');
	const originalGetComputedStyle = window.getComputedStyle;
	let transientReads = 0;
	let chart;
	let series;
	try {
		Object.defineProperty(document, 'readyState', { configurable: true, value: 'loading' });
		window.getComputedStyle = function(element, pseudoElement) {
			if (element.style.color === 'red') {
				transientReads++;
				return { color: 'rgb(128, 128, 128)' };
			}
			return originalGetComputedStyle.call(window, element, pseudoElement);
		};
		chart = window.chart = LightweightCharts.createChart(container, {
			layout: { attributionLogo: false },
		});
		series = chart.addSeries(LightweightCharts.LineSeries, { color: 'red' });
		series.setData([
			{ time: '2025-01-01', value: 10 },
			{ time: '2025-01-02', value: 20 },
		]);
		chart.timeScale().fitContent();
		chart.takeScreenshot();
		if (transientReads === 0) {
			throw new Error('The test must exercise browser color parsing during loading');
		}
	} finally {
		window.getComputedStyle = originalGetComputedStyle;
		if (originalReadyState) {
			Object.defineProperty(document, 'readyState', originalReadyState);
		} else {
			delete document.readyState;
		}
	}
	// A normal data update must recover the red axis label rather than retaining gray.
	series.update({ time: '2025-01-03', value: 15 });
	chart.timeScale().fitContent();
}
