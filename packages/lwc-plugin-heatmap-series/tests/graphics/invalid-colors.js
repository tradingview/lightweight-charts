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

function turbo(t) {
	t = Math.max(0, Math.min(1, t));
	const r = Math.max(0, Math.min(255, Math.round(34.61 + t * (1172.33 - t * (10793.56 - t * (33300.12 - t * (38394.49 - t * 14825.05)))))));
	const g = Math.max(0, Math.min(255, Math.round(23.31 + t * (557.33 + t * (1225.33 - t * (3574.96 - t * (1073.77 + t * 707.56)))))));
	const b = Math.max(0, Math.min(255, Math.round(27.2 + t * (3211.1 - t * (15327.97 - t * (27814 - t * (22569.18 - t * 6838.66)))))));
	return `rgb(${r}, ${g}, ${b})`;
}

// A shader that returns no valid color for some amounts: those cells are not
// drawn and leave a hole, instead of taking the color of the cell drawn
// before them. Cells with a NaN amount or edge are skipped too. An invalid
// border color draws no border, and the cells still are.
function runTestCase(container) {
	const chart = (window.chart = LightweightCharts.createChart(container, {
		layout: { attributionLogo: false },
		timeScale: { barSpacing: 18 },
	}));
	const series = LwcPlugin.createHeatmapSeries(chart, {
		cellShader: amount => (amount > 60 && amount < 75 ? 'not-a-color' : amount > 85 ? `rgba(0, ${NaN}, 0, 1)` : turbo(amount / 100)),
		cellBorderWidth: 2,
		cellBorderColor: 'no-such-color',
	});
	series.setData(generateData().map((point, index) => (index % 4 === 0
		? { ...point, cells: point.cells.map((cell, r) => (r === 3 ? { ...cell, amount: NaN } : r === 6 ? { ...cell, high: NaN } : cell)) }
		: point)));
	chart.timeScale().fitContent();
}
