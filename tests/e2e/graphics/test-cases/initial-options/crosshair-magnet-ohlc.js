// Line should appear at the price of 80 instead of 0

function runTestCase(container) {
	const chart = window.chart = LightweightCharts.createChart(container, {
		crosshair: {
			horzLine: {
				color: '#ff0000',
				width: 2,
			},
			mode: 3, // MagnetOHLC
		},
		layout: { attributionLogo: false },
		rightPriceScale: {
			scaleMargins: {
				top: 0.05,
				bottom: 0.05,
			},
		},
	});

	const mainSeries = chart.addSeries(
		LightweightCharts.CandlestickSeries,
		{
			downColor: 'rgba(255, 0, 0, 0.1)',
			wickDownColor: 'rgba(255, 0, 0, 0.1)',
			borderDownColor: 'rgba(255, 0, 0, 0.1)',
		}
	);

	mainSeries.setData([
		{ open: 80, high: 100, low: 0, close: 0, time: '2025-03-10' },
		{ open: 80, high: 100, low: 0, close: 0, time: '2025-03-11' },
		{ open: 80, high: 100, low: 0, close: 0, time: '2025-03-12' },
		{ open: 80, high: 100, low: 0, close: 0, time: '2025-03-13' },
		{ open: 80, high: 100, low: 0, close: 0, time: '2025-03-14' },
		{ open: 80, high: 100, low: 0, close: 0, time: '2025-03-15' },
	]);

	chart.timeScale().fitContent();
}
