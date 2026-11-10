function generateData(count = 30, rows = 10, rowHeight = 10) {
	const res = [];
	const time = new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0));
	for (let i = 0; i < count; ++i) {
		const cells = [];
		for (let r = 0; r < rows; ++r) {
			const amount = Math.round(50 + Math.sin(i / 4 + r / 2) * 40 + Math.cos(i * 1.3 + r) * 10);
			cells.push({ low: r * rowHeight, high: (r + 1) * rowHeight, amount });
		}
		res.push({ time: time.getTime() / 1000, cells });
		time.setUTCDate(time.getUTCDate() + 1);
	}
	return res;
}

// createColorScale with three stops and no domain spreads its colors over the
// amounts in view, here 200 to 800: the lowest cells take the first stop and
// the highest the last, whatever the amounts are.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 18 },
	}));
	const series = LwcPlugin.createHeatmapSeries(chart, {
		cellShader: LwcPlugin.createColorScale({ stops: ['rgba(41, 98, 255, 0.1)', '#2962FF', '#F23645'], steps: 8 }),
		cellGap: 0,
	});
	series.setData(generateData().map(point => ({ ...point, cells: point.cells.map(cell => ({ ...cell, amount: 200 + cell.amount * 6 })) })));
	chart.timeScale().fitContent();
}
